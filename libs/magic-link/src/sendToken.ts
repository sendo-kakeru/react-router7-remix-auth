import crypto from "crypto-js";
import * as v from "valibot";
import { redirect, SessionStorage } from "react-router";

export type VerifyEmailFunction = {
  (email: string): Promise<string>;
};
export type SendOptions = {
  successRedirect: string;
};
export type SendEmailOptions = {
  email: string;
  magicLink: string;
};
export type SendEmailFunction = {
  (options: SendEmailOptions): Promise<void>;
};

const verifyEmailAddress: VerifyEmailFunction = async (email) => {
  return v.parse(
    v.pipe(
      v.string(),
      v.nonEmpty("メールアドレスを入力してください。"),
      v.email("メールアドレスの形式が正しくありません。"),
      v.maxLength(40, "メールアドレスは40文字以内で入力してください。"),
    ),
    email,
  );
};

export class SendToken {
  private readonly secret: string;
  private readonly emailFieldKey: string = "email";
  private readonly sendEmail: SendEmailFunction;
  private readonly sessionMagicLinkKey: string;
  private readonly sessionEmailKey: string;
  private readonly callbackURL: string;
  private readonly magicLinkSearchParamKey: string;
  private readonly validateEmail: VerifyEmailFunction;

  constructor(options: {
    secret: string;
    emailFieldKey?: string;
    sendEmail: SendEmailFunction;
    sessionMagicLinkKey?: string;
    sessionEmailKey?: string;
    callbackURL?: string;
    magicLinkSearchParamKey?: string;
    verifyEmailAddress?: VerifyEmailFunction;
  }) {
    this.secret = options.secret;
    this.emailFieldKey = options.emailFieldKey ?? this.emailFieldKey;
    this.sendEmail = options.sendEmail;
    this.sessionMagicLinkKey = options.sessionMagicLinkKey ?? "auth:magiclink";
    this.sessionEmailKey = options.sessionEmailKey ?? "auth:email";
    this.callbackURL = options.callbackURL ?? "/api/auth/email-link/callback";
    this.magicLinkSearchParamKey = options.magicLinkSearchParamKey ?? "token";
    this.validateEmail = options.verifyEmailAddress ?? verifyEmailAddress;
  }

  public async send(
    request: Request,
    sessionStorage: SessionStorage,
    options: SendOptions,
  ): Promise<Response> {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const urlSearchParams = new URLSearchParams(await request.text());
    const formData = new FormData();

    for (const [name, value] of urlSearchParams) {
      formData.append(name, value);
    }
    const email = await this.validateEmail(urlSearchParams.get(this.emailFieldKey) ?? "");
    const domainUrl = this.getDomainURL(request);
    const magicLink = await this.getMagicLink(email, domainUrl, formData);

    await this.sendEmail({
      email,
      magicLink,
    });

    session.set(this.sessionMagicLinkKey, await this.encrypt(magicLink));
    session.set(this.sessionEmailKey, email);

    return redirect(options.successRedirect, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }

  private getDomainURL(request: Request): string {
    const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");

    if (!host) {
      throw new Error("Could not determine domain URL.");
    }

    const protocol =
      host.includes("localhost") || host.includes("127.0.0.1")
        ? "http"
        : request.headers.get("X-Forwarded-Proto") ?? "https";

    return `${protocol}://${host}`;
  }

  private async getMagicLink(
    emailAddress: string,
    domainUrl: string,
    formData: FormData,
  ): Promise<string> {
    const formKeys = [...formData.keys()];
    const formPayload =
      formKeys.length === 1
        ? undefined
        : Object.fromEntries(
            formKeys
              .filter((key) => key !== this.emailFieldKey)
              .map((key) => [
                key,
                formData.getAll(key).length > 1 ? formData.getAll(key) : formData.get(key),
              ]),
          );
    const payload = {
      e: emailAddress,
      ...(formPayload && { f: formPayload }),
      c: Date.now(),
    };
    const stringToEncrypt = JSON.stringify(payload);
    const encryptedString = await this.encrypt(stringToEncrypt);
    const url = new URL(domainUrl);
    url.pathname = this.callbackURL;
    url.searchParams.set(this.magicLinkSearchParamKey, encryptedString);
    return url.toString();
  }
  private async encrypt(value: string): Promise<string> {
    return crypto.AES.encrypt(value, this.secret).toString();
  }
}
