import { Strategy } from "remix-auth/strategy";
import { decrypt } from "./crypto";

/**
 * The content of the magic link payload. Keys are minified so that the resulting link is as short as possible.
 */
export type MagicLinkPayload = {
  /**
   * Email address used to authenticate.
   */
  e: string;
  /**
   * Form data received in the request.
   */
  f?: Record<string, unknown>;
  /**
   * Creation date of the magic link, as an ISO string. This is used to check
   * the email link is still valid.
   */
  c: number;
};

/**
 * This interface declares what configuration the strategy needs from the
 * developer to correctly work.
 */
export type EmailLinkStrategyOptions = {
  /**
   * The name of the form input used to get the email.
   * @default "email"
   */
  emailField?: string;
  /**
   * The param name the strategy will use to read the token from the email link.
   * @default "token"
   */
  magicLinkSearchParam?: string;
  /**
   * How long the magic link will be valid. Default to 30 minutes.
   * @default 1_800_000
   */
  linkExpirationTime?: number;
  /**
   * Add an extra layer of protection and validate the magic link is valid.
   * @default false
   */
  validateSessionMagicLink?: boolean;
};

/**
 * This interface declares what the developer will receive from the strategy
 * to verify the user identity in their system.
 */
export type EmailLinkStrategyVerifyParams = {
  email: string;
  /**
   * True, if the verify callback is called after clicking on the magic link
   */
  magicLinkVerify: boolean;
};

export namespace EmailLinkStrategy {
  export interface VerifyOptions {
    email: string;
  }
}

export class EmailLinkStrategy<User> extends Strategy<User, EmailLinkStrategyVerifyParams> {
  public name = "email-link";

  private readonly emailField: string = "email";

  private readonly magicLinkSearchParam: string;

  private readonly linkExpirationTime: number;

  private readonly validateSessionMagicLink: boolean;

  constructor(
    options: EmailLinkStrategyOptions,
    verify: Strategy.VerifyFunction<User, EmailLinkStrategy.VerifyOptions>,
  ) {
    super(verify);
    this.emailField = options.emailField ?? this.emailField;
    this.magicLinkSearchParam = options.magicLinkSearchParam ?? "token";
    this.linkExpirationTime = options.linkExpirationTime ?? 1000 * 60 * 30; // 30 minutes
    this.validateSessionMagicLink = options.validateSessionMagicLink ?? false;
  }

  public async authenticate(request: Request): Promise<User> {
    // If we get here, the user clicked on the magic link inside email

    const sessionMagicLink = await request.text();
    const { emailAddress: email } = await this.validateMagicLink(
      request.url,
      await decrypt(sessionMagicLink),
    );
    // now that we have the user email we can call verify to get the user
    return this.verify({ email, magicLinkVerify: true });
  }

  private getMagicLinkCode(link: string) {
    try {
      const url = new URL(link);
      return url.searchParams.get(this.magicLinkSearchParam) ?? "";
    } catch {
      return "";
    }
  }

  private async validateMagicLink(requestUrl: string, sessionMagicLink?: string) {
    const linkCode = this.getMagicLinkCode(requestUrl);
    const sessionLinkCode = sessionMagicLink ? this.getMagicLinkCode(sessionMagicLink) : null;

    let emailAddress;
    let linkCreationTime;
    let form: Record<string, unknown>;
    try {
      const decryptedString = await decrypt(linkCode);
      const payload = JSON.parse(decryptedString) as MagicLinkPayload;
      emailAddress = payload.e;
      form = payload.f ?? {};
      form[this.emailField] = emailAddress;
      linkCreationTime = payload.c;
    } catch (error: unknown) {
      console.error(error);
      throw new Error("Sign in link invalid. Please request a new one.");
    }

    if (typeof emailAddress !== "string") {
      throw new TypeError("Sign in link invalid. Please request a new one.");
    }

    if (this.validateSessionMagicLink) {
      if (!sessionLinkCode) {
        throw new Error("Sign in link invalid. Please request a new one.");
      }
      if (linkCode !== sessionLinkCode) {
        throw new Error(
          `You must open the magic link on the same device it was created from for security reasons. Please request a new link.`,
        );
      }
    }

    if (typeof linkCreationTime !== "number") {
      throw new TypeError("Sign in link invalid. Please request a new one.");
    }

    const expirationTime = linkCreationTime + this.linkExpirationTime;
    if (Date.now() > expirationTime) {
      throw new Error("Magic link expired. Please request a new one.");
    }
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (Array.isArray(form[key])) {
        (form[key] as unknown[]).forEach((value) => {
          formData.append(key, value as string | Blob);
        });
      } else {
        formData.append(key, form[key] as string | Blob);
      }
    });
    return { emailAddress, form: formData };
  }
}
