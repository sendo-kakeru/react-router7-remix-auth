
import { Authenticator } from "remix-auth";
import { googleStrategy } from "./google-strategy.server";
import { User } from "@prisma/client";

const authenticator = new Authenticator<User>();
authenticator.use(googleStrategy);
export const remixAuthenticator = authenticator;
