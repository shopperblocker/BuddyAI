import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = ['/dashboard', '/assessment', '/onboarding'].some(
        (path) => nextUrl.pathname.startsWith(path),
      );
      if (isProtected) return isLoggedIn;
      return true;
    },
  },
  providers: [],
};
