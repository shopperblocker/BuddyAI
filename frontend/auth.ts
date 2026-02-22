import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Resend from "next-auth/providers/resend";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Apple,
    Resend({
      from: process.env.AUTH_EMAIL_FROM || "BuddyAI <onboarding@resend.dev>",
    }),
  ],
  pages: {
    signIn: "/",
  },
});
