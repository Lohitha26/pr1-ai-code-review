# System Architecture Overview

This document provides a high-level overview of how all components work together in the Real-Time Code Collaboration Platform.

## Table of Contents
1. [System Architecture Diagram](#system-architecture-diagram)
2. [Request Flow](#request-flow)
3. [Real-Time Sync Flow](#real-time-sync-flow)
4. [Component Responsibilities](#component-responsibilities)
5. [Data Flow](#data-flow)
6. [Scaling Considerations](#scaling-considerations)

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │   Next.js Pages  │    │  React Components│    │   Monaco Editor  │  │
│  │   (App Router)   │    │  - Editor        │    │   (Code Editor)  │  │
│  │                  │    │  - Chat          │    │                  │  │
│  │  - Home          │    │  - AI Panel      │    │  MonacoBinding   │  │
│  │  - Sessions List │    │  - Participants  │    │  (Yjs ↔ Monaco)  │  │
│  │  - Editor Page   │    │                  │    │                  │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘  │
│           │                       │                       │             │
│           └───────────────────────┼───────────────────────┘             │
│                                   │                                     │
│  ┌────────────────────────────────┼─────────────────────────────────┐  │
│  │                         Client-Side State                        │  │
│  │                                                                  │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │  │
│  │  │  Y.Doc       │    │ Socket.io    │    │ NextAuth Session │  │  │
│  │  │  (CRDT State)│◄───┤ Client       │    │ (User Auth)      │  │  │
│  │  │              │    │              │    │                  │  │  │
│  │  │ - Y.Text     │    │ TypedSocket  │    │ - User ID        │  │  │
│  │  │ - Awareness  │    │              │    │ - User Name      │  │  │
│  │  └──────────────┘    └──────┬───────┘    └──────────────────┘  │  │
│  └────────────────────────────┼──────────────────────────────────┘  │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │ WebSocket / HTTP
                                 │
┌────────────────────────────────┼─────────────────────────────────────┐
│                                ▼                                      │
│                         SERVER (Node.js)                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Server                             │   │
│  │                                                               │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                 │   │
│  │  │  API Routes     │    │  Server Actions │                 │   │
│  │  │                 │    │                 │                 │   │
│  │  │ /api/sessions   │    │ - Create Session│                 │   │
│  │  │ /api/ai/review  │    │ - Join Session  │                 │   │
│  │  │ /api/auth       │    │                 │                 │   │
│  │  └────────┬────────┘    └────────┬────────┘                 │   │
│  │           │                      │                          │   │
│  └───────────┼──────────────────────┼──────────────────────────┘   │
│              │                      │                              │
│  ┌───────────┼──────────────────────┼──────────────────────────┐   │
│  │           ▼                      ▼                          │   │
│  │     ┌─────────────────────────────────────────┐            │   │
│  │     │        Socket.io Server                 │            │   │
│  │     │                                         │            │   │
│  │     │  - Connection Management                │            │   │
│  │     │  - Room Management (Sessions)           │            │   │
│  │     │  - Yjs Update Broadcasting              │            │   │
│  │     │  - Awareness Synchronization            │            │   │
│  │     │  - Chat Message Relay                   │            │   │
│  │     └──────────┬──────────────────────────────┘            │   │
│  │                │                                           │   │
│  └────────────────┼───────────────────────────────────────────┘   │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Redis   │  │PostgreSQL│  │ OpenAI   │
│          │  │          │  │   API    │
│ Pub/Sub  │  │ - Users  │  │          │
│ Caching  │  │ - Sessions│ │ GPT-4    │
│          │  │ - Messages│ │ Turbo    │
└──────────┘  └──────────┘  └──────────┘
```

---

## Request Flow

### 1. HTTP Request Flow (Traditional)

```
User clicks "Create Session"
  │
  ├─► Browser sends POST /api/sessions
  │     │
  │     ├─► Next.js API Route Handler
  │     │     │
  │     │     ├─► Check NextAuth session (authenticated?)
  │     │     │
  │     │     ├─► Validate request body (Zod schema)
  │     │     │
  │     │     ├─► Prisma Client
  │     │     │     │
  │     │     │     └─► PostgreSQL: INSERT INTO code_sessions
  │     │     │
  │     │     └─► Return JSON response
  │     │
  │     └─► Browser receives response
  │
  └─► Router navigates to /session/[id]
```

### 2. WebSocket Connection Flow

```
User opens /session/[id]
  │
  ├─► SessionPage component mounts
  │     │
  │     ├─► getSocket() creates Socket.io client
  │     │     │
  │     │     └─► WebSocket handshake with server
  │     │           │
  │     │           ├─► HTTP Upgrade request
  │     │           │
  │     │           └─► WebSocket connection established
  │     │
  │     ├─► socket.emit('join-session', sessionId, userId, userName)
  │     │     │
  │     │     └─► Server receives event
  │     │           │
  │     │           ├─► Verify session exists (Prisma query)
  │     │           │
  │     │           ├─► socket.join(sessionId) - add to room
  │     │           │
  │     │           ├─► Load Yjs document from DB
  │     │           │
  │     │           ├─► Send current state to client
  │     │           │
  │     │           └─► Broadcast 'user-joined' to others
  │     │
  │     └─► CollaborativeEditor component mounts
  │           │
  │           ├─► Create Y.Doc
  │           │
  │           ├─► Create SocketIOProvider
  │           │     │
  │           │     └─► Set up bidirectional sync
  │           │
  │           └─► Create MonacoBinding
  │                 │
  │                 └─► Connect Monaco ↔ Yjs
  │
  └─► User can now edit collaboratively!
```

---

## Real-Time Sync Flow

### Scenario: User A types "Hello"

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User A's Browser                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    User types "Hello"
                              │
                              ▼
                    ┌──────────────────┐
                    │  Monaco Editor   │
                    │  Buffer: "Hello" │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ MonacoBinding    │
                    │ Convert to Yjs   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Y.Text.insert(0, │
                    │    "Hello")      │
                    └────────┬─────────┘
                             │
                    Emit 'update' event
                             │
                             ▼
                    ┌──────────────────┐
                    │ SocketIOProvider │
                    │ Catch update     │
                    └────────┬─────────┘
                             │
                socket.emit('yjs-update')
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Socket.io Server                            │
└─────────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Apply to    │  │ Broadcast   │  │ Publish to  │
    │ Server's    │  │ to room     │  │ Redis       │
    │ Y.Doc       │  │ (other      │  │ (other      │
    │             │  │ clients)    │  │ servers)    │
    └─────────────┘  └──────┬──────┘  └─────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          User B's Browser                            │
└─────────────────────────────────────────────────────────────────────┘
                            │
              socket.on('yjs-update', update)
                            │
                            ▼
                    ┌──────────────────┐
                    │ SocketIOProvider │
                    │ Receive update   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Y.applyUpdate()  │
                    │ Merge into doc   │
                    └────────┬─────────┘
                             │
                    Emit 'update' event
                             │
                             ▼
                    ┌──────────────────┐
                    │ MonacoBinding    │
                    │ Convert to Monaco│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Monaco Editor   │
                    │  Buffer: "Hello" │
                    └──────────────────┘
                             │
                    User B sees "Hello"!
```

**Time Elapsed**: ~50-100ms (depending on network latency)

---

## Component Responsibilities

### Frontend Components

#### `app/page.tsx` - Home Page
- **Purpose**: Landing page with navigation
- **Responsibilities**:
  - Display feature overview
  - Links to create/join sessions
- **State**: None (static)

#### `app/sessions/page.tsx` - Sessions List
- **Purpose**: Browse and create sessions
- **Responsibilities**:
  - Fetch sessions from API
  - Display session cards
  - Create session modal
- **State**: Sessions list, modal visibility

#### `app/(editor)/session/[sessionId]/page.tsx` - Editor Page
- **Purpose**: Main collaborative editing interface
- **Responsibilities**:
  - Initialize Socket.io connection
  - Render editor, chat, AI panel
  - Manage layout (show/hide panels)
- **State**: Socket, user color, code, panel visibility

#### `components/Editor.tsx` - Monaco Editor
- **Purpose**: Code editor with Yjs integration
- **Responsibilities**:
  - Load Monaco editor
  - Create Yjs document and provider
  - Bind Monaco to Yjs
  - Track cursor position
- **State**: Y.Doc, SocketIOProvider, MonacoBinding

#### `components/Chat.tsx` - Chat Sidebar
- **Purpose**: Real-time chat
- **Responsibilities**:
  - Display messages
  - Send messages via Socket.io
  - Auto-scroll to bottom
- **State**: Messages array

#### `components/AiReviewPanel.tsx` - AI Review
- **Purpose**: Display AI code suggestions
- **Responsibilities**:
  - Call /api/ai/review
  - Display suggestions
  - Handle loading/error states
- **State**: Suggestions, loading, error

---

### Backend Components

#### `server.ts` - Custom Server
- **Purpose**: Run Next.js + Socket.io together
- **Responsibilities**:
  - Create HTTP server
  - Initialize Next.js app
  - Initialize Socket.io server
  - Start listening on port
- **Lifecycle**: Runs for entire server lifetime

#### `server/socket-server.ts` - Socket.io Logic
- **Purpose**: Handle WebSocket events
- **Responsibilities**:
  - Manage connections and rooms
  - Broadcast Yjs updates
  - Relay chat messages
  - Persist Yjs state to database
- **State**: Active Yjs documents (in-memory Map)

#### `app/api/sessions/route.ts` - Sessions API
- **Purpose**: CRUD operations for sessions
- **Responsibilities**:
  - List sessions (GET)
  - Create session (POST)
  - Validate auth and input
- **Dependencies**: Prisma, NextAuth

#### `app/api/ai/review/route.ts` - AI Review API
- **Purpose**: Get code review from OpenAI
- **Responsibilities**:
  - Validate code input
  - Call OpenAI API
  - Parse and format response
  - Handle errors and rate limits
- **Dependencies**: OpenAI SDK

#### `app/api/auth/[...nextauth]/route.ts` - Authentication
- **Purpose**: Handle OAuth flow
- **Responsibilities**:
  - GitHub OAuth integration
  - Session management
  - JWT generation
- **Dependencies**: NextAuth, Prisma Adapter

---

### Data Layer

#### `lib/prisma.ts` - Database Client
- **Purpose**: Singleton Prisma client
- **Responsibilities**:
  - Create/reuse Prisma client
  - Prevent multiple instances in dev
- **Pattern**: Singleton

#### `lib/redis.ts` - Redis Client
- **Purpose**: Redis pub/sub and caching
- **Responsibilities**:
  - Connect to Redis
  - Provide pub/sub clients
  - Handle reconnection
- **Pattern**: Singleton with separate pub/sub clients

#### `lib/socket.ts` - Socket.io Client
- **Purpose**: Typed Socket.io client
- **Responsibilities**:
  - Create socket connection
  - Provide type-safe event emitters
  - Handle reconnection
- **Pattern**: Singleton

---

## Data Flow

### Session Creation Flow

```
1. User fills form → 2. POST /api/sessions → 3. Validate auth
                                                      │
                                                      ▼
                                              4. Validate input (Zod)
                                                      │
                                                      ▼
                                              5. Prisma.codeSession.create()
                                                      │
                                                      ▼
                                              6. PostgreSQL INSERT
                                                      │
                                                      ▼
                                              7. Return session ID
                                                      │
                                                      ▼
8. Navigate to /session/[id] ◄─────────────────────────┘
```

### Collaborative Editing Flow

```
User A types
    │
    ▼
Monaco Editor
    │
    ▼
MonacoBinding (Monaco → Yjs)
    │
    ▼
Y.Text.insert()
    │
    ▼
Y.Doc emits 'update'
    │
    ▼
SocketIOProvider catches update
    │
    ▼
socket.emit('yjs-update', update)
    │
    ▼
Socket.io Server
    │
    ├─► Apply to server's Y.Doc
    │
    ├─► Broadcast to room (other clients)
    │
    └─► Publish to Redis (other servers)
          │
          ▼
User B's socket.on('yjs-update')
    │
    ▼
Y.applyUpdate(doc, update)
    │
    ▼
Y.Doc emits 'update'
    │
    ▼
MonacoBinding (Yjs → Monaco)
    │
    ▼
Monaco Editor updates
    │
    ▼
User B sees change!
```

### AI Review Flow

```
User clicks "Review Code"
    │
    ▼
POST /api/ai/review { code, language }
    │
    ▼
Validate input (Zod)
    │
    ▼
Build prompt (system + user messages)
    │
    ▼
openai.chat.completions.create()
    │
    ▼
OpenAI API (GPT-4 Turbo)
    │
    ▼
Parse JSON response
    │
    ▼
Return { suggestions, summary, tokensUsed }
    │
    ▼
AiReviewPanel displays suggestions
```

---

## Scaling Considerations

### Single Server (Development)

```
┌─────────────────────────────────────┐
│         Node.js Server              │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  Next.js     │  │ Socket.io   │ │
│  │  (HTTP)      │  │ (WebSocket) │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
│  In-Memory: Map<sessionId, Y.Doc>  │
└─────────────────────────────────────┘
         │                  │
         ▼                  ▼
   PostgreSQL            Redis
```

**Limitations**:
- Single point of failure
- Limited concurrent connections (~10k)
- No load balancing

---

### Multi-Server (Production with Redis Pub/Sub)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Server 1    │     │  Server 2    │     │  Server 3    │
│              │     │              │     │              │
│  User A ─────┼─┐   │  User B ─────┼─┐   │  User C ─────┼─┐
│  User D ─────┼─┤   │  User E ─────┼─┤   │  User F ─────┼─┤
└──────┬───────┘ │   └──────┬───────┘ │   └──────┬───────┘ │
       │         │          │         │          │         │
       └─────────┼──────────┼─────────┼──────────┼─────────┘
                 │          │         │          │
                 └──────────┼─────────┼──────────┘
                            │         │
                            ▼         ▼
                    ┌─────────────────────┐
                    │   Redis Pub/Sub     │
                    │                     │
                    │  Channel: yjs:*     │
                    └─────────────────────┘
```

**How it works**:
1. User A (Server 1) types "Hello"
2. Server 1 broadcasts to local clients
3. Server 1 publishes to Redis channel `yjs:session-id`
4. Server 2 and Server 3 subscribe to `yjs:*`
5. They receive the update and broadcast to their local clients
6. User B (Server 2) and User C (Server 3) see "Hello"

**Benefits**:
- Horizontal scaling
- Load balancing
- High availability
- Handle 100k+ concurrent connections

---

### Serverless Deployment (Vercel)

**Challenge**: Vercel functions are stateless and short-lived
- Can't maintain WebSocket connections
- Can't store Yjs documents in memory

**Solution**: Separate WebSocket Server

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Serverless)                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Next.js Pages & API Routes                      │   │
│  │  - /api/sessions (HTTP)                          │   │
│  │  - /api/ai/review (HTTP)                         │   │
│  │  - /api/auth (HTTP)                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           │
┌──────────────────────────┼──────────────────────────────┐
│                          ▼                               │
│              Separate WebSocket Server                   │
│              (Railway, Render, DigitalOcean)             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Socket.io Server                                │   │
│  │  - Handle WebSocket connections                  │   │
│  │  - Manage Yjs documents                          │   │
│  │  - Broadcast updates                             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
   PostgreSQL            Redis            OpenAI API
   (Supabase)          (Upstash)
```

**Configuration**:
```typescript
// In client code
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://ws.example.com');
```

---

## Performance Optimizations

### 1. Yjs Update Batching
- Yjs automatically batches updates (16ms default)
- Reduces network traffic
- Configurable: `doc.transact(() => { /* batch operations */ })`

### 2. Binary Protocol
- Yjs uses binary encoding (Uint8Array)
- 10x smaller than JSON for large documents
- Example: 1000-line change = ~100 bytes

### 3. Redis Pub/Sub
- Efficient message broadcasting
- Low latency (~1-5ms)
- Scales to millions of messages/second

### 4. Database Indexing
```sql
CREATE INDEX idx_sessions_owner ON code_sessions(ownerId);
CREATE INDEX idx_participants_session ON participants(sessionId);
CREATE INDEX idx_messages_session_time ON chat_messages(sessionId, createdAt);
```

### 5. Connection Pooling
```typescript
// Prisma automatically pools connections
// Configure in DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=10
```

---

## Security Considerations

### 1. Authentication
- All API routes check NextAuth session
- Socket.io events verify user identity
- JWT tokens are httpOnly cookies

### 2. Authorization
- Session owners can delete sessions
- Private sessions check ownership
- Rate limiting on AI API

### 3. Input Validation
- Zod schemas for all API inputs
- Prisma prevents SQL injection
- XSS protection (React escapes by default)

### 4. Secrets Management
- Environment variables for all secrets
- Never commit `.env` files
- Use Vercel/Railway secret management in production

---

## Monitoring and Debugging

### Development
```bash
# Enable Prisma query logging
DATABASE_URL="...?connection_limit=10&log=query"

# Socket.io debug mode
DEBUG=socket.io* npm run dev

# Next.js verbose logging
NODE_OPTIONS='--inspect' npm run dev
```

### Production
- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics
- **Logs**: CloudWatch, Datadog
- **Uptime**: UptimeRobot

---

## Related Documentation
- [Prisma Schema Walkthrough](./walkthrough/01-prisma-schema.md)
- [Yjs Provider Walkthrough](./walkthrough/02-yjs-provider.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Learning Plan](./LEARNING_PLAN.md)
