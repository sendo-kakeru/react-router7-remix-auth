
import { Authenticator } from "libs/remix-auth";
import { googleStrategy } from "./google-strategy.server";
import { authSessionStorage } from "./auth.session-storage.server";
import { User } from "@prisma/client";

const authenticator = new Authenticator<User>(authSessionStorage, {
  sessionKey: "me",
  throwOnError: true,
});
authenticator.use(googleStrategy);
export const remixAuthenticator = authenticator;
