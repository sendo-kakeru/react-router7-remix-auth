import { User } from "@prisma/client";
import { GoogleProfile, GoogleStrategy } from "libs/remix-auth-google";
import prisma from "./prisma.server";
import { OAuth2Tokens } from "arctic";

export const googleStrategy = new GoogleStrategy<User>(
  {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectURI: `${process.env.SITE_URL}/api/auth/google/callback`,
  },
  async ({ tokens }) => {
    const googleProfile: GoogleProfile = await (async (tokens: OAuth2Tokens) => {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }
      const raw: GoogleProfile["_json"] = await response.json();
      const profile: GoogleProfile = {
        id: raw.sub,
        displayName: raw.name,
        name: {
          familyName: raw.family_name,
          givenName: raw.given_name,
        },
        emails: [{ value: raw.email }],
        photos: [{ value: raw.picture }],
        _json: raw,
      };
      return profile;
    })(tokens);


    const me = await prisma.user.findUnique({
      where: {
        id: googleProfile.id,
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
          id: googleProfile.id,
          email: googleProfile.emails[0].value,
          name: googleProfile.emails[0].value,
        },
      });
    }
  },
);
