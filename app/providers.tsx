/**
 * Client-side Providers
 * 
 * Wraps the app with necessary providers (NextAuth session provider, etc.)
 */

'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
