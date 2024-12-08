import { createFileSessionStorage } from "@react-router/node";
import { createCookie } from "react-router";

const EXPIRATION_DURATION_IN_SECONDS = 60 * 60 * 24 * 180;

const expires = new Date();
expires.setSeconds(expires.getSeconds() + EXPIRATION_DURATION_IN_SECONDS);

const sessionCookie = createCookie("auth_session", {
  secrets: [process.env.SESSION_SECRET!],
  sameSite: "lax",
  expires,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
});

export const authSessionStorage = createFileSessionStorage({
  cookie: sessionCookie,
  dir: "./sessions",
});
