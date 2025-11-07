/**
 * Custom Next.js Server with Socket.io
 * 
 * This file creates a custom server that runs both Next.js and Socket.io.
 * Required because Socket.io needs a persistent WebSocket connection,
 * which isn't directly supported by Next.js serverless functions.
 * 
 * Note: For Vercel deployment, Socket.io will need to run separately
 * or use a compatible alternative like Ably or Pusher.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './server/socket-server';
import { validateEnv } from './lib/env';

// Validate environment variables before starting the server
try {
  console.log('🔍 Validating environment variables...');
  validateEnv();
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Environment validation failed');
  process.exit(1);
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app with proper configuration for App Router
const app = next({ 
  dev, 
  hostname, 
  port,
  // Ensure Next.js handles all routes properly
  customServer: true,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url!, true);
      
      // Let Next.js handle all requests (including API routes)
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io server
  initSocketServer(httpServer);

  // Start listening
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running on ws://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});
