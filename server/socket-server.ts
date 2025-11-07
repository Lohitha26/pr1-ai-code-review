/**
 * Socket.io Server Setup
 * 
 * This file sets up the Socket.io server for real-time communication.
 * It handles:
 * - WebSocket connections
 * - Room management (sessions)
 * - Yjs update broadcasting via Redis pub/sub
 * - Awareness (cursor) synchronization
 * - Chat messages
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { redisClient, redisSubscriber } from '../lib/redis';
import prisma from '../lib/prisma';
import * as Y from 'yjs';

// Types for Socket.io events (must match client-side types)
interface ServerToClientEvents {
  'yjs-update': (update: Uint8Array) => void;
  'yjs-awareness': (update: Uint8Array) => void;
  'chat-message': (message: ChatMessage) => void;
  'user-joined': (user: UserInfo) => void;
  'user-left': (userId: string) => void;
  'participants-update': (participants: UserInfo[]) => void;
  'session-not-found': () => void;
  'unauthorized': () => void;
}

interface ClientToServerEvents {
  'join-session': (sessionId: string, userId: string, userName: string) => void;
  'leave-session': (sessionId: string) => void;
  'yjs-update': (sessionId: string, update: Uint8Array) => void;
  'yjs-awareness': (sessionId: string, update: Uint8Array) => void;
  'send-message': (sessionId: string, message: string) => void;
  'request-sync': (sessionId: string) => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

interface UserInfo {
  id: string;
  name: string;
  color: string;
}

// Store active Yjs documents in memory (one per session)
const yjsDocs = new Map<string, Y.Doc>();

// Store session participants
const sessionParticipants = new Map<string, Set<string>>();

/**
 * Initialize Socket.io server
 */
export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: '/api/socket/io',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  console.log('Socket.io server initialized');

  // Set up Redis pub/sub for multi-server synchronization
  setupRedisPubSub(io);

  /**
   * Handle new socket connections
   */
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    /**
     * Join a coding session
     */
    socket.on('join-session', async (sessionId, userId, userName) => {
      try {
        // Verify session exists in database
        const session = await prisma.codeSession.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          socket.emit('session-not-found');
          return;
        }

        // Join the Socket.io room for this session
        socket.join(sessionId);
        console.log(`User ${userName} (${userId}) joined session ${sessionId}`);

        // Track participant
        if (!sessionParticipants.has(sessionId)) {
          sessionParticipants.set(sessionId, new Set());
        }
        sessionParticipants.get(sessionId)!.add(userId);

        // Get or create Yjs document for this session
        let ydoc = yjsDocs.get(sessionId);
        if (!ydoc) {
          ydoc = new Y.Doc();
          
          // Load persisted state from database if it exists
          if (session.yjsState && session.yjsState.length > 0) {
            try {
              // Validate the Yjs state before applying
              const stateArray = new Uint8Array(session.yjsState);
              if (stateArray.length > 0) {
                Y.applyUpdate(ydoc, stateArray);
                console.log(`Loaded Yjs state for session ${sessionId} (${stateArray.length} bytes)`);
              }
            } catch (error) {
              console.error('Error applying Yjs state from database:', error);
              console.log('Falling back to text snapshot if available');
              // Initialize with text snapshot if Yjs state is corrupted
              if (session.lastSnapshot) {
                const yText = ydoc.getText('monaco');
                yText.insert(0, session.lastSnapshot);
              }
            }
          } else if (session.lastSnapshot) {
            // Fallback to text snapshot if no Yjs state
            console.log(`Loading text snapshot for session ${sessionId}`);
            const yText = ydoc.getText('monaco');
            yText.insert(0, session.lastSnapshot);
          } else {
            // New session - initialize with empty text
            console.log(`Initializing new empty document for session ${sessionId}`);
            ydoc.getText('monaco'); // Just create the text type
          }
          
          yjsDocs.set(sessionId, ydoc);
        }

        // Send current document state to the new user only if there's content
        // Check if the document has any content before sending
        const yText = ydoc.getText('monaco');
        if (yText.length > 0 || ydoc.store.clients.size > 0) {
          try {
            const stateVector = Y.encodeStateAsUpdate(ydoc);
            // Only send if the state vector is valid and not empty
            if (stateVector && stateVector.length > 0) {
              socket.emit('yjs-update', stateVector);
            }
          } catch (error) {
            console.error('Error encoding Yjs state:', error);
          }
        }

        // Notify other users that someone joined
        socket.to(sessionId).emit('user-joined', {
          id: userId,
          name: userName,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });

        // Update participant in database
        await prisma.participant.upsert({
          where: {
            sessionId_userId: {
              sessionId,
              userId,
            },
          },
          create: {
            sessionId,
            userId,
            role: 'editor',
          },
          update: {
            leftAt: null, // Mark as active
          },
        });
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('unauthorized');
      }
    });

    /**
     * Handle Yjs document updates
     */
    socket.on('yjs-update', async (sessionId, update) => {
      try {
        // Validate update before processing
        if (!update || update.length === 0) {
          console.warn('Received empty yjs-update, skipping');
          return;
        }

        // Ensure update is a Uint8Array
        if (!(update instanceof Uint8Array)) {
          console.warn('yjs-update is not a Uint8Array, attempting conversion');
          update = new Uint8Array(update);
        }

        // Apply update to server's Yjs document
        const ydoc = yjsDocs.get(sessionId);
        if (ydoc) {
          Y.applyUpdate(ydoc, update);
        }

        // Broadcast to other clients in the same session (except sender)
        socket.to(sessionId).emit('yjs-update', update);

        // Publish to Redis for other server instances
        await redisClient.publish(
          `yjs:${sessionId}`,
          JSON.stringify({
            type: 'update',
            data: Array.from(update), // Convert Uint8Array to regular array for JSON
          })
        );

        // Periodically save to database (debounced in production)
        // For simplicity, we'll save on every update here
        // In production, use a debounced save function
        if (ydoc) {
          const state = Y.encodeStateAsUpdate(ydoc);
          const text = ydoc.getText('monaco').toString();
          
          await prisma.codeSession.update({
            where: { id: sessionId },
            data: {
              yjsState: Buffer.from(state),
              lastSnapshot: text,
              updatedAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Error handling yjs-update:', error);
      }
    });

    /**
     * Handle awareness updates (cursors, selections)
     */
    socket.on('yjs-awareness', async (sessionId, update) => {
      try {
        // Validate awareness update
        if (!update || update.length === 0) {
          console.warn('Received empty yjs-awareness update, skipping');
          return;
        }
        
        // Ensure it's a Uint8Array
        if (!(update instanceof Uint8Array)) {
          console.warn('yjs-awareness is not a Uint8Array, attempting conversion');
          try {
            update = new Uint8Array(update);
          } catch (conversionError) {
            console.error('Failed to convert awareness update:', conversionError);
            return;
          }
        }
        
        // Check for valid content
        const hasContent = Array.from(update).some(byte => byte !== 0);
        if (!hasContent) {
          console.warn('Awareness update contains only zeros, skipping');
          return;
        }
        
        // Validate minimum length
        if (update.length < 2) {
          console.warn('Awareness update too short, skipping');
          return;
        }

        // Broadcast to other clients in the same session
        socket.to(sessionId).emit('yjs-awareness', update);

        // Publish to Redis for other server instances
        await redisClient.publish(
          `yjs:${sessionId}`,
          JSON.stringify({
            type: 'awareness',
            data: Array.from(update),
          })
        );
      } catch (error) {
        console.error('Error handling yjs-awareness:', error);
      }
    });

    /**
     * Handle chat messages
     */
    socket.on('send-message', async (sessionId, message) => {
      try {
        // Get user info from socket (in production, verify from session/JWT)
        const userId = 'user-id'; // TODO: Get from authenticated session
        const userName = 'User'; // TODO: Get from authenticated session

        // Save message to database
        const chatMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            userId,
            userName,
            message,
          },
        });

        // Broadcast to all clients in the session
        const messageData: ChatMessage = {
          id: chatMessage.id,
          userId: chatMessage.userId,
          userName: chatMessage.userName,
          message: chatMessage.message,
          timestamp: chatMessage.createdAt.getTime(),
        };

        io.to(sessionId).emit('chat-message', messageData);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    /**
     * Handle sync request - send full document state to client
     */
    socket.on('request-sync', async (sessionId) => {
      try {
        const ydoc = yjsDocs.get(sessionId);
        if (ydoc) {
          const yText = ydoc.getText('monaco');
          // Only send state if document has content
          if (yText.length > 0 || ydoc.store.clients.size > 0) {
            const stateVector = Y.encodeStateAsUpdate(ydoc);
            if (stateVector && stateVector.length > 0) {
              socket.emit('yjs-update', stateVector);
              console.log(`Sent sync state to client ${socket.id} for session ${sessionId}`);
            }
          }
        }
      } catch (error) {
        console.error('Error handling request-sync:', error);
      }
    });

    /**
     * Handle leaving a session
     */
    socket.on('leave-session', async (sessionId) => {
      socket.leave(sessionId);
      console.log(`Client ${socket.id} left session ${sessionId}`);
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

/**
 * Set up Redis pub/sub to synchronize Yjs updates across server instances
 * This is crucial for horizontal scaling
 */
function setupRedisPubSub(io: SocketIOServer) {
  // Subscribe to all yjs channels
  redisSubscriber.pSubscribe('yjs:*', (message, channel) => {
    try {
      const sessionId = channel.replace('yjs:', '');
      const data = JSON.parse(message);

      if (data.type === 'update') {
        // Convert array back to Uint8Array
        const update = new Uint8Array(data.data);
        
        // Validate before broadcasting
        if (update && update.length > 0) {
          // Broadcast to all clients in this server instance
          io.to(sessionId).emit('yjs-update', update);
        }
      } else if (data.type === 'awareness') {
        // Validate data array exists and has content
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          console.warn('Redis: Received invalid awareness data, skipping');
          return;
        }
        
        const update = new Uint8Array(data.data);
        
        // Additional validation: check for valid content
        const hasContent = update.some(byte => byte !== 0);
        if (!hasContent) {
          console.warn('Redis: Awareness update contains only zeros, skipping');
          return;
        }
        
        // Validate minimum length (awareness updates need at least 2 bytes)
        if (update.length < 2) {
          console.warn('Redis: Awareness update too short, skipping');
          return;
        }
        
        // Broadcast to all clients in this server instance
        io.to(sessionId).emit('yjs-awareness', update);
      }
    } catch (error) {
      console.error('Error handling Redis pub/sub message:', error);
    }
  });

  console.log('Redis pub/sub initialized for Yjs synchronization');
}
