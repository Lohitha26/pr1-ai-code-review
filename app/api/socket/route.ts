/**
 * Socket.io API Route Handler
 * 
 * This route initializes the Socket.io server when accessed.
 * Note: In production with Vercel, you'll need a separate WebSocket server
 * or use Vercel's Edge Runtime with compatible alternatives.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  // Socket.io initialization happens in the custom server (see server.ts)
  // This endpoint is just a placeholder for the Socket.io path
  return NextResponse.json({ 
    message: 'Socket.io server is running',
    path: '/api/socket/io'
  });
}
