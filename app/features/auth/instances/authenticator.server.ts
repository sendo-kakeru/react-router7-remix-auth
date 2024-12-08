import { Authenticator } from "remix-auth";
import { googleStrategy } from "./google-strategy.server";
import { User } from "@prisma/client";
import { emailLinkStrategy } from "./email-link-strategy.server";

const authenticator = new Authenticator<User>();
authenticator.use(googleStrategy);
authenticator.use(emailLinkStrategy);
export const remixAuthenticator = authenticator;
