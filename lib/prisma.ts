/**
 * Prisma Client Singleton
 * 
 * This file creates a single instance of PrismaClient that's reused across the application.
 * In development, Next.js hot-reloading can create multiple instances, so we use a global
 * variable to persist the client across reloads.
 */

import { PrismaClient } from '@prisma/client';

// Extend the global namespace to include our prisma property
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a new PrismaClient instance or reuse the existing one
// In production, create a new instance
// In development, reuse the global instance to prevent connection exhaustion
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// In development, store the client in the global object
// This prevents creating multiple instances during hot-reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
