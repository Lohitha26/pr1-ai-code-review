/**
 * NextAuth.js Configuration
 * 
 * Centralized auth configuration that can be imported by both
 * the API route and server components.
 */

import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';

/**
 * Validate GitHub OAuth credentials
 * Prevents using placeholder values that cause 404 errors
 * Only validates at runtime, not during build
 */
function validateGitHubCredentials() {
  const githubId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
  const githubSecret = process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;

  // Skip validation during build time (when env vars might not be available)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return { 
      githubId: githubId || 'build-time-placeholder', 
      githubSecret: githubSecret || 'build-time-placeholder' 
    };
  }

  if (!githubId || !githubSecret) {
    console.error(
      '⚠️  GitHub OAuth credentials are missing. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.'
    );
    // Return placeholder values to allow build to complete
    return { 
      githubId: githubId || 'missing-github-id', 
      githubSecret: githubSecret || 'missing-github-secret' 
    };
  }

  // Check for placeholder values (only in production runtime)
  if (process.env.NODE_ENV === 'production') {
    const placeholders = ['your-github-oauth-app-id', 'your-github-oauth-app-secret', 'build-time-placeholder', 'missing-github'];
    if (placeholders.some(p => githubId.includes(p) || githubSecret.includes(p))) {
      console.error(
        '⚠️  GitHub OAuth credentials contain placeholder values. ' +
        'Please set real GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET from https://github.com/settings/developers'
      );
    }
  }

  return { githubId, githubSecret };
}

// Get credentials (validation happens lazily)
const { githubId, githubSecret } = validateGitHubCredentials();

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter to store users and sessions in database
  adapter: PrismaAdapter(prisma) as any,
  
  // Configure authentication providers
  providers: [
    GithubProvider({
      clientId: githubId,
      clientSecret: githubSecret,
      // Request additional GitHub permissions if needed
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],

  // Configure session strategy
  session: {
    strategy: 'jwt', // Use JWT for sessions (required for Edge runtime)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Customize pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Ensure proper URL configuration
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  // Add secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,

  // Callbacks for customizing behavior
  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     */
    async jwt({ token, user, account }) {
      // Add user ID to token on sign in
      if (user) {
        token.id = user.id;
      }
      
      // Add GitHub access token if available
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },

    /**
     * Session callback - runs when session is checked
     */
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      
      return session;
    },

    /**
     * Sign in callback - can be used to control access
     */
    async signIn({ user }) {
      // Log successful sign-in for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User signed in:', user.email);
      }
      return true;
    },
  },

  // Event handlers for logging and debugging
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session }) {
      console.log(`User signed out: ${session?.user?.email || 'unknown'}`);
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};
