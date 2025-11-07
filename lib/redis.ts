/**
 * Redis Client Setup
 * 
 * Creates and configures a Redis client for pub/sub messaging and caching.
 * Used to synchronize Yjs updates across multiple server instances.
 */

import { createClient } from 'redis';

// Type for Redis client
export type RedisClientType = ReturnType<typeof createClient>;

// Create Redis client with connection string from environment
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create the main Redis client for pub/sub
const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff: wait longer between each retry
      // Max wait time: 3 seconds
      if (retries > 10) {
        console.error('Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Create a separate client for subscribing (Redis requires separate connections for pub/sub)
const redisSubscriber = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis Subscriber: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Error handlers
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisSubscriber.on('error', (err) => {
  console.error('Redis Subscriber Error:', err);
});

// Connection event handlers
redisClient.on('connect', () => {
  console.log('Redis Client: Connected');
});

redisSubscriber.on('connect', () => {
  console.log('Redis Subscriber: Connected');
});

// Initialize connections
let isConnecting = false;

export async function connectRedis() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    if (!redisSubscriber.isOpen) {
      await redisSubscriber.connect();
    }
    console.log('Redis: All clients connected successfully');
  } catch (error) {
    console.error('Redis: Connection error:', error);
    isConnecting = false;
    throw error;
  } finally {
    isConnecting = false;
  }
}

// Graceful shutdown
export async function disconnectRedis() {
  try {
    await redisClient.quit();
    await redisSubscriber.quit();
    console.log('Redis: All clients disconnected');
  } catch (error) {
    console.error('Redis: Disconnect error:', error);
  }
}

// Export clients
export { redisClient, redisSubscriber };

// Auto-connect in non-test environments
if (process.env.NODE_ENV !== 'test') {
  connectRedis().catch(console.error);
}
