# Walkthrough: Socket.io Server (`server/socket-server.ts`)

## File Purpose
This file implements the Socket.io server that handles all real-time WebSocket communication. It's the central hub for:
- Managing client connections
- Broadcasting Yjs updates between clients
- Relaying chat messages
- Tracking session participants
- Persisting document state to the database

## When This Runs
- **Server-side only**
- Initialized once when the server starts (`server.ts` calls `initSocketServer()`)
- Runs continuously for the lifetime of the server
- Handles multiple concurrent connections

## Key Responsibilities

### 1. Connection Management
- Accept new WebSocket connections
- Authenticate users
- Assign clients to session rooms
- Handle disconnections

### 2. Yjs Synchronization
- Store active Yjs documents in memory
- Apply updates from clients
- Broadcast updates to other clients in the same session
- Publish to Redis for multi-server setups

### 3. Persistence
- Save Yjs state to PostgreSQL periodically
- Load Yjs state when sessions are joined
- Store both binary (yjsState) and text (lastSnapshot) versions

### 4. Chat Relay
- Receive chat messages from clients
- Save to database
- Broadcast to all session participants

---

## Data Structures

### In-Memory Storage

```typescript
// Map of sessionId → Y.Doc
const yjsDocs = new Map<string, Y.Doc>();

// Map of sessionId → Set of userIds
const sessionParticipants = new Map<string, Set<string>>();
```

**Why in-memory?**
- Fast access (no database query needed)
- Yjs documents need to be in memory for CRDT operations
- Cleared on server restart (reloaded from database on demand)

---

## Event Flow Diagrams

### Join Session Flow

```
Client                          Server                          Database
  |                               |                               |
  |-- emit('join-session') ------>|                               |
  |                               |                               |
  |                               |-- Query session ------------->|
  |                               |<-- Session data --------------|
  |                               |                               |
  |                               | Verify session exists         |
  |                               | socket.join(sessionId)        |
  |                               |                               |
  |                               | Load/create Y.Doc             |
  |                               | Get current state             |
  |                               |                               |
  |<-- emit('yjs-update') --------|                               |
  | (full document state)         |                               |
  |                               |                               |
  |                               |-- broadcast('user-joined') -->|
  |                               |   to other clients            |
  |                               |                               |
  |                               |-- Upsert participant -------->|
  |                               |<-- Confirmation --------------|
```

### Yjs Update Flow

```
Client A                        Server                          Client B
  |                               |                               |
  | User types "Hello"            |                               |
  |-- emit('yjs-update') -------->|                               |
  |                               |                               |
  |                               | Apply to server's Y.Doc       |
  |                               | Y.applyUpdate(doc, update)    |
  |                               |                               |
  |                               |-- broadcast to room --------->|
  |                               |   (except sender)             |
  |                               |                               |
  |                               |                               | Apply update
  |                               |                               | Y.applyUpdate()
  |                               |                               | Display "Hello"
  |                               |                               |
  |                               |-- Publish to Redis ---------->|
  |                               |   (for other servers)         |
  |                               |                               |
  |                               |-- Save to DB ---------------->|
  |                               |   (debounced)                 |
```

---

## Code Walkthrough

### Initialization

```typescript
export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      path: '/api/socket/io',
      // Custom path for Socket.io endpoint
      // Clients connect to: http://localhost:3000/api/socket/io
      
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // CORS configuration for cross-origin requests
      // Important for development when frontend and backend are on different ports
      
      transports: ['websocket', 'polling'],
      // Try WebSocket first, fallback to HTTP long-polling
      // Polling is slower but works through restrictive firewalls
    }
  );
```

**TypeScript Generics**:
- `ClientToServerEvents`: Events client can emit
- `ServerToClientEvents`: Events server can emit
- Provides full type safety for event names and payloads

### Join Session Handler

```typescript
socket.on('join-session', async (sessionId, userId, userName) => {
  try {
    // 1. Verify session exists
    const session = await prisma.codeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      socket.emit('session-not-found');
      return;
    }
```

**Security Check**: Always verify the session exists before allowing join. Prevents users from creating arbitrary rooms.

```typescript
    // 2. Join Socket.io room
    socket.join(sessionId);
    // Rooms are like chat channels
    // All sockets in a room receive broadcasts to that room
```

**Socket.io Rooms**:
- Logical grouping of connections
- `io.to(roomName).emit()` sends to all sockets in that room
- A socket can be in multiple rooms

```typescript
    // 3. Track participant
    if (!sessionParticipants.has(sessionId)) {
      sessionParticipants.set(sessionId, new Set());
    }
    sessionParticipants.get(sessionId)!.add(userId);
```

**Participant Tracking**: Used to show "X participants" count and participant list in UI.

```typescript
    // 4. Get or create Yjs document
    let ydoc = yjsDocs.get(sessionId);
    if (!ydoc) {
      ydoc = new Y.Doc();
      
      // Load persisted state from database
      if (session.yjsState) {
        Y.applyUpdate(ydoc, session.yjsState);
      } else if (session.lastSnapshot) {
        // Fallback: initialize from text snapshot
        const yText = ydoc.getText('monaco');
        yText.insert(0, session.lastSnapshot);
      }
      
      yjsDocs.set(sessionId, ydoc);
    }
```

**Document Loading Priority**:
1. **yjsState** (binary): Preferred, includes full CRDT history
2. **lastSnapshot** (text): Fallback, plain text without history
3. **Empty**: New session, start with blank document

```typescript
    // 5. Send current state to new user
    const stateVector = Y.encodeStateAsUpdate(ydoc);
    socket.emit('yjs-update', stateVector);
```

**State Vector**: Encodes the entire document state as a single update. New user applies this to get in sync.

```typescript
    // 6. Notify other users
    socket.to(sessionId).emit('user-joined', {
      id: userId,
      name: userName,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    });
```

**Broadcast Pattern**: `socket.to(room)` sends to everyone in the room **except** the sender.

```typescript
    // 7. Update database
    await prisma.participant.upsert({
      where: {
        sessionId_userId: { sessionId, userId },
      },
      create: {
        sessionId,
        userId,
        role: 'editor',
      },
      update: {
        leftAt: null, // Mark as active again
      },
    });
  } catch (error) {
    console.error('Error joining session:', error);
    socket.emit('unauthorized');
  }
});
```

**Upsert Pattern**: Create if doesn't exist, update if exists. Handles users rejoining sessions.

---

### Yjs Update Handler

```typescript
socket.on('yjs-update', async (sessionId, update) => {
  try {
    // 1. Apply to server's document
    const ydoc = yjsDocs.get(sessionId);
    if (ydoc) {
      Y.applyUpdate(ydoc, update);
    }
```

**Why apply on server?**
- Server maintains authoritative state
- Can validate updates (future enhancement)
- Enables server-side features (e.g., auto-save, version history)

```typescript
    // 2. Broadcast to other clients
    socket.to(sessionId).emit('yjs-update', update);
```

**Efficient Broadcasting**: Only send to clients in the same session, excluding the sender (they already have the update).

```typescript
    // 3. Publish to Redis for other servers
    await redisClient.publish(
      `yjs:${sessionId}`,
      JSON.stringify({
        type: 'update',
        data: Array.from(update), // Uint8Array → Array for JSON
      })
    );
```

**Multi-Server Sync**: Redis pub/sub ensures all server instances receive updates, even if clients are connected to different servers.

```typescript
    // 4. Save to database (on every update)
    // In production, debounce this to reduce DB writes
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
```

**Persistence Strategy**:
- **Current**: Save on every update (simple, but many DB writes)
- **Better**: Debounce saves (e.g., save at most once per 5 seconds)
- **Best**: Save on disconnect + periodic snapshots

**Debounced Save Example**:
```typescript
const saveToDB = debounce(async (sessionId: string, ydoc: Y.Doc) => {
  const state = Y.encodeStateAsUpdate(ydoc);
  const text = ydoc.getText('monaco').toString();
  await prisma.codeSession.update({
    where: { id: sessionId },
    data: { yjsState: Buffer.from(state), lastSnapshot: text },
  });
}, 5000); // Save at most once per 5 seconds
```

---

### Redis Pub/Sub Setup

```typescript
function setupRedisPubSub(io: SocketIOServer) {
  // Subscribe to all yjs channels
  redisSubscriber.pSubscribe('yjs:*', (message, channel) => {
    try {
      const sessionId = channel.replace('yjs:', '');
      const data = JSON.parse(message);

      if (data.type === 'update') {
        const update = new Uint8Array(data.data);
        io.to(sessionId).emit('yjs-update', update);
      } else if (data.type === 'awareness') {
        const update = new Uint8Array(data.data);
        io.to(sessionId).emit('yjs-awareness', update);
      }
    } catch (error) {
      console.error('Error handling Redis pub/sub message:', error);
    }
  });
}
```

**Pattern Subscription**: `pSubscribe('yjs:*')` subscribes to all channels matching the pattern (e.g., `yjs:session-123`, `yjs:session-456`).

**Why Separate Pub/Sub Clients?**
- Redis requires separate connections for publishing and subscribing
- Subscriber connection is in "subscriber mode" and can't run other commands

---

## Performance Considerations

### Memory Usage

**Problem**: Storing all Yjs documents in memory can use significant RAM.

**Solution**:
```typescript
// Implement LRU cache with size limit
const MAX_DOCS = 100;
const yjsDocs = new LRUCache<string, Y.Doc>({ max: MAX_DOCS });

// Or: Evict inactive documents
setInterval(() => {
  yjsDocs.forEach((doc, sessionId) => {
    const participants = sessionParticipants.get(sessionId);
    if (!participants || participants.size === 0) {
      // No active users, save and evict
      saveToDatabase(sessionId, doc);
      yjsDocs.delete(sessionId);
    }
  });
}, 60000); // Check every minute
```

### Database Writes

**Problem**: Saving on every update causes many DB writes.

**Solution**: Debounce saves
```typescript
const pendingSaves = new Map<string, NodeJS.Timeout>();

function scheduleSave(sessionId: string, ydoc: Y.Doc) {
  // Cancel pending save
  if (pendingSaves.has(sessionId)) {
    clearTimeout(pendingSaves.get(sessionId)!);
  }
  
  // Schedule new save
  const timeout = setTimeout(async () => {
    await saveToDatabase(sessionId, ydoc);
    pendingSaves.delete(sessionId);
  }, 5000);
  
  pendingSaves.set(sessionId, timeout);
}
```

### Redis Bandwidth

**Problem**: Publishing every update to Redis uses bandwidth.

**Solution**: Only publish if multiple servers exist
```typescript
const SERVER_COUNT = parseInt(process.env.SERVER_COUNT || '1');

if (SERVER_COUNT > 1) {
  await redisClient.publish(`yjs:${sessionId}`, ...);
}
```

---

## Error Handling

### Connection Errors

```typescript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Log to monitoring service (e.g., Sentry)
});

socket.on('disconnect', (reason) => {
  console.log('Client disconnected:', reason);
  // Reasons: 'transport close', 'client namespace disconnect', etc.
  
  // Clean up participant tracking
  sessionParticipants.forEach((participants, sessionId) => {
    // Remove this user from all sessions
    // (In production, track which sessions this socket was in)
  });
});
```

### Database Errors

```typescript
try {
  await prisma.codeSession.update(...);
} catch (error) {
  console.error('Database error:', error);
  // Don't crash the server
  // Log error and continue
  // Consider retry logic for transient errors
}
```

---

## Security Considerations

### 1. Authentication

**Current**: Basic user ID/name passed from client
**Production**: Verify JWT token or session

```typescript
socket.on('join-session', async (sessionId, token) => {
  // Verify token
  const user = await verifyToken(token);
  if (!user) {
    socket.emit('unauthorized');
    return;
  }
  
  // Check permissions
  const session = await prisma.codeSession.findUnique({
    where: { id: sessionId },
  });
  
  if (!session.isPublic && session.ownerId !== user.id) {
    socket.emit('unauthorized');
    return;
  }
  
  // Proceed with join
});
```

### 2. Rate Limiting

```typescript
const updateCounts = new Map<string, number>();

socket.on('yjs-update', async (sessionId, update) => {
  const key = `${socket.id}:${sessionId}`;
  const count = updateCounts.get(key) || 0;
  
  if (count > 100) { // Max 100 updates per second
    socket.emit('rate-limit-exceeded');
    return;
  }
  
  updateCounts.set(key, count + 1);
  setTimeout(() => updateCounts.delete(key), 1000);
  
  // Process update
});
```

### 3. Input Validation

```typescript
socket.on('yjs-update', async (sessionId, update) => {
  // Validate sessionId format
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    return;
  }
  
  // Validate update size
  if (update.length > 1024 * 1024) { // Max 1MB
    socket.emit('update-too-large');
    return;
  }
  
  // Process update
});
```

---

## Monitoring and Debugging

### Logging

```typescript
// Log all events in development
if (process.env.NODE_ENV === 'development') {
  io.on('connection', (socket) => {
    socket.onAny((eventName, ...args) => {
      console.log(`[${socket.id}] ${eventName}`, args);
    });
  });
}
```

### Metrics

```typescript
// Track active connections
let activeConnections = 0;

io.on('connection', (socket) => {
  activeConnections++;
  console.log(`Active connections: ${activeConnections}`);
  
  socket.on('disconnect', () => {
    activeConnections--;
    console.log(`Active connections: ${activeConnections}`);
  });
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    activeConnections,
    activeSessions: yjsDocs.size,
    totalParticipants: Array.from(sessionParticipants.values())
      .reduce((sum, set) => sum + set.size, 0),
  });
});
```

---

## Testing

### Unit Test Example

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

describe('Socket Server', () => {
  let io: Server;
  let clientSocket: any;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should broadcast yjs-update to other clients', (done) => {
    const client2 = Client(`http://localhost:${port}`);
    
    client2.on('yjs-update', (update) => {
      expect(update).toBeDefined();
      client2.close();
      done();
    });
    
    clientSocket.emit('yjs-update', 'test-session', new Uint8Array([1, 2, 3]));
  });
});
```

---

## Related Files
- `server.ts` - Initializes this Socket.io server
- `lib/yjs/provider.ts` - Client-side counterpart
- `lib/redis.ts` - Redis client used for pub/sub
- `prisma/schema.prisma` - Database models

---

## Next Steps
1. Implement debounced database saves
2. Add authentication/authorization
3. Add rate limiting
4. Implement LRU cache for documents
5. Add comprehensive error handling
6. Set up monitoring (Sentry, DataDog)
