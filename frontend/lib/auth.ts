import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { query } from './db';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { rows } = await query('SELECT * FROM users WHERE email = $1', [
          credentials.email,
        ]);
        if (!rows[0]) return null;
        const valid = await bcrypt.compare(
          String(credentials.password),
          rows[0].password_hash,
        );
        if (!valid) return null;
        return { id: rows[0].id, email: rows[0].email, name: rows[0].name };
      },
    }),
  ],
});
