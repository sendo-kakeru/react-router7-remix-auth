import { Strategy } from "remix-auth/strategy";
import crypto from "crypto-js";

export type MagicLinkPayload = {
  e: string;
  f?: Record<string, unknown>;
  c: number;
};

export type EmailLinkStrategyOptions = {
  secret: string;
  emailFieldKey?: string;
  magicLinkSearchParam?: string;
  linkExpirationTime?: number;
  validateSessionMagicLink?: boolean;
};

export type EmailLinkStrategyVerifyParams = {
  email: string;
  magicLinkVerify: boolean;
};

export namespace EmailLinkStrategy {
  export interface VerifyOptions {
    email: string;
  }
}

export class EmailLinkStrategy<User> extends Strategy<User, EmailLinkStrategyVerifyParams> {
  public name = "email-link";
  private readonly secret: string;
  private readonly emailFieldKey: string = "email";
  private readonly magicLinkSearchParam: string;
  private readonly linkExpirationTime: number;
  private readonly validateSessionMagicLink: boolean;

  constructor(
    options: EmailLinkStrategyOptions,
    verify: Strategy.VerifyFunction<User, EmailLinkStrategy.VerifyOptions>,
  ) {
    super(verify);
    this.secret = options.secret;
    this.emailFieldKey = options.emailFieldKey ?? this.emailFieldKey;
    this.magicLinkSearchParam = options.magicLinkSearchParam ?? "token";
    this.linkExpirationTime = options.linkExpirationTime ?? 1000 * 60 * 30; // 30 minutes
    this.validateSessionMagicLink = options.validateSessionMagicLink ?? true;
  }

  public async authenticate(request: Request): Promise<User> {
    const sessionMagicLink = await request.text();
    const { emailAddress: email } = await this.validateMagicLink(
      request.url,
      await this.decrypt(sessionMagicLink),
    );
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
      const decryptedString = await this.decrypt(linkCode);
      const payload = JSON.parse(decryptedString) as MagicLinkPayload;
      emailAddress = payload.e;
      form = payload.f ?? {};
      form[this.emailFieldKey] = emailAddress;
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
  private async decrypt(value: string): Promise<string> {
    const bytes = crypto.AES.decrypt(value, this.secret);
    return bytes.toString(crypto.enc.Utf8);
  }
}
