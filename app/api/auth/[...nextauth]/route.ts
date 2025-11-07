/**
 * NextAuth.js API Route Handler
 * 
 * This catch-all route handles all NextAuth.js authentication requests:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback/[provider]
 * - /api/auth/session
 * - /api/auth/csrf
 * - etc.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// Export for both GET and POST requests
export { handler as GET, handler as POST };
