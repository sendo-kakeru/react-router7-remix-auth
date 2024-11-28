import { User } from "@prisma/client";
import { GoogleStrategy } from "libs/remix-auth-google";
import prisma from "./prisma.server";


export const googleStrategy = new GoogleStrategy<User>(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.SITE_URL}/api/auth/google/callback`,
  },
  async ({ profile }) => {
    const me = await prisma.user.findUnique({
      where: {
        id: profile.id,
      },
    });
    if (me) {
      if (!me.isActive) {
        throw new Error("アカウントが無効です。");
      }
      return me;
    } else {
      return prisma.user.create({
        data: {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.emails[0].value}
      })
    }
  },
);
