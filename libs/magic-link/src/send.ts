import { redirect, SessionStorage } from "react-router";
import { encrypt } from "./crypto";

export type SendEmailOptions = {
  email: string;
  magicLink: string;
};

export type SendEmailFunction = {
  (options: SendEmailOptions): Promise<void>;
};

/**
 * Validate the email address the user is trying to use to login.
 * This can be useful to ensure it's not a disposable email address.
 * @param emailAddress The email address to validate
 */
export type VerifyEmailFunction = {
  (email: string): Promise<string>;
};

async function verifyEmailAddress(email: string): Promise<string> {
  if (!/.+@.+/u.test(email)) {
    throw new Error("A valid email is required.");
  }
  return email;
}

function getDomainURL(request: Request): string {
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

async function getMagicLink({
  email,
  domainUrl,
  emailField,
  callbackURL,
  magicLinkSearchParamKey,
  formData,
}: {
  email: string;
  domainUrl: string;
  emailField: string;
  callbackURL: string;
  magicLinkSearchParamKey: string;
  formData: FormData;
}): Promise<string> {
  const formKeys = [...formData.keys()];
  const formPayload =
    formKeys.length === 1
      ? undefined
      : Object.fromEntries(
          formKeys
            .filter((key) => key !== emailField)
            .map((key) => [
              key,
              formData.getAll(key).length > 1 ? formData.getAll(key) : formData.get(key),
            ]),
        );
  const payload = {
    e: email,
    ...(formPayload && { f: formPayload }),
    c: Date.now(),
  };
  const stringToEncrypt = JSON.stringify(payload);
  const encryptedString = await encrypt(stringToEncrypt);
  const url = new URL(domainUrl);
  url.pathname = callbackURL;
  url.searchParams.set(magicLinkSearchParamKey, encryptedString);
  return url.toString();
}

export async function send(
  request: Request,
  sessionStorage: SessionStorage,
  {
    successRedirect,
    emailField = "email",
    sendEmail,
    validateEmail = verifyEmailAddress,
    callbackURL = "/api/auth/email-link/callback",
    magicLinkSearchParamKey = "token",
    sessionMagicLinkKey = "auth:magiclink",
    sessionEmailKey = "auth:email",
  }: {
    successRedirect: string;
    emailField?: string;
    sendEmail: SendEmailFunction;
    validateEmail?: VerifyEmailFunction;
    callbackURL?: string;
    magicLinkSearchParamKey?: string;
    sessionMagicLinkKey?: string;
    sessionEmailKey?: string;
  },
) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const urlSearchParams = new URLSearchParams(await request.text());
  const formData = new FormData();
  const email = urlSearchParams.get(emailField);
  const validEmail = await validateEmail(email ?? "");
  const domainUrl = getDomainURL(request);
  for (const [name, value] of urlSearchParams) {
    formData.append(name, value);
  }

  const magicLink = await getMagicLink({
    email: validEmail,
    domainUrl,
    emailField,
    callbackURL,
    magicLinkSearchParamKey,
    formData,
  });

  await sendEmail({
    email: validEmail,
    magicLink,
  });

  session.set(sessionMagicLinkKey, await encrypt(magicLink));
  session.set(sessionEmailKey, email);

  return redirect(successRedirect, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}
