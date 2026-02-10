/**
 * @fileoverview Route module
 * @module [...nextauth]/route
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        return { id: 'user_1', email: credentials.email };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

/**
 * Error handler for route
 * @param {Error} error - Error to handle
 */
function handleRouteError(error) {
  try {
    console.error('[route]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
