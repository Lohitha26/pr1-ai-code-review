/**
 * Middleware for Next.js
 * 
 * Handles authentication and route protection.
 * Runs on every request before the page is rendered.
 */

export { default } from 'next-auth/middleware';

/**
 * Configure which routes require authentication
 */
export const config = {
  matcher: [
    // Protect session routes
    '/session/:path*',
    '/sessions',
    // Protect API routes (except auth)
    '/api/sessions/:path*',
    '/api/ai/:path*',
  ],
};
