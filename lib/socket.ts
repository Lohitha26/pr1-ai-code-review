/**
 * Socket.io Client Wrapper
 * 
 * This file provides a typed wrapper around Socket.io client for use in React components.
 * It handles connection management, reconnection, and provides type-safe event emitters.
 */

'use client';

import { io, Socket } from 'socket.io-client';

// Define the shape of events our socket can emit and receive
export interface ServerToClientEvents {
  // Yjs sync events
  'yjs-update': (update: Uint8Array) => void;
  'yjs-awareness': (update: Uint8Array) => void;
  
  // Chat events
  'chat-message': (message: ChatMessage) => void;
  
  // Session events
  'user-joined': (user: UserInfo) => void;
  'user-left': (userId: string) => void;
  'participants-update': (participants: UserInfo[]) => void;
  
  // Connection events
  'session-not-found': () => void;
  'unauthorized': () => void;
}

export interface ClientToServerEvents {
  // Join/leave session
  'join-session': (sessionId: string, userId: string, userName: string) => void;
  'leave-session': (sessionId: string) => void;
  
  // Yjs sync events
  'yjs-update': (sessionId: string, update: Uint8Array) => void;
  'yjs-awareness': (sessionId: string, update: Uint8Array) => void;
  
  // Chat events
  'send-message': (sessionId: string, message: string) => void;
  
  // Request current state
  'request-sync': (sessionId: string) => void;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface UserInfo {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
}

// Type for our socket with custom events
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

/**
 * Get or create a Socket.io client instance
 * This ensures we only have one socket connection per client
 */
export function getSocket(): TypedSocket {
  if (!socket) {
    // Determine the socket server URL
    // Only access window on the client side
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    // Create socket with configuration
    socket = io(socketUrl, {
      path: '/api/socket/io',
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket.io: Connected', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.io: Disconnected', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io: Connection error', error);
    });
  }

  return socket;
}

/**
 * Disconnect and cleanup the socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
