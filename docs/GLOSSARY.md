# Glossary of Key Terms

This glossary explains important concepts used throughout the Real-Time Code Collaboration Platform.

## Real-Time Collaboration Concepts

### CRDT (Conflict-free Replicated Data Type)
**Definition**: A data structure that can be replicated across multiple computers in a network, where replicas can be updated independently and concurrently without coordination, and it is always mathematically possible to resolve inconsistencies that might result.

**Why it matters**: CRDTs enable true real-time collaboration without a central server making decisions about conflicts. Each user's edits are guaranteed to converge to the same final state.

**Example**: When two users type at the same position simultaneously, a CRDT ensures both edits are preserved in a deterministic order, unlike traditional approaches that might lose one edit.

**Related terms**: Operational Transformation (OT), Eventual Consistency

---

### Operational Transformation (OT)
**Definition**: An algorithm for transforming operations (like text insertions/deletions) so they can be applied in different orders on different replicas while maintaining consistency.

**Why it matters**: OT was the traditional approach to collaborative editing (used in Google Docs early versions) but requires a central server to order operations.

**CRDT vs OT**:
- **OT**: Requires central server, complex transformation functions, but smaller message sizes
- **CRDT**: Peer-to-peer capable, simpler logic, but larger metadata overhead

---

### Yjs
**Definition**: A high-performance CRDT implementation for building collaborative applications. It provides shared data types (Text, Array, Map) that automatically sync across clients.

**Why it matters**: Yjs handles all the complex CRDT math for us, providing a simple API to build collaborative features.

**Key Yjs Types**:
- `Y.Text` - For collaborative text editing
- `Y.Map` - For key-value data (like user awareness)
- `Y.Array` - For ordered lists

---

### Awareness
**Definition**: Metadata about users' current state in a collaborative session (cursor position, selection, name, color).

**Why it matters**: Awareness lets users see where others are working, preventing conflicts and improving coordination.

**Not part of CRDT**: Awareness is ephemeral (temporary) data that doesn't need to be persisted or conflict-resolved.

---

### Delta vs Snapshot
**Delta**: Incremental changes to a document (e.g., "insert 'hello' at position 5")
**Snapshot**: Complete state of a document at a point in time

**Why it matters**: 
- Deltas are efficient for real-time sync (small messages)
- Snapshots are used for persistence and new user initialization

---

### Vector Clock
**Definition**: A data structure used to track causality in distributed systems. Each replica maintains a vector of logical timestamps.

**Why it matters**: Vector clocks help CRDTs determine which operations happened before, after, or concurrently with others.

**Example**: If User A's clock is [A:5, B:3] and User B's is [A:4, B:6], we know B has seen A's first 4 operations but not the 5th.

---

### Causality
**Definition**: The relationship between events where one event influences another. In collaborative editing, if operation B was created after seeing operation A, then A → B (A causes B).

**Why it matters**: Preserving causality ensures edits appear in logical order. If User A types "Hello" then User B types " World" after seeing "Hello", causality ensures the result is "Hello World", not "World Hello".

---

## WebSocket & Real-Time Communication

### WebSocket
**Definition**: A protocol providing full-duplex (two-way) communication channels over a single TCP connection.

**Why it matters**: Unlike HTTP (request-response), WebSockets allow servers to push data to clients instantly, essential for real-time collaboration.

**Lifecycle**:
1. Client initiates HTTP upgrade request
2. Server accepts, connection upgraded to WebSocket
3. Bidirectional messages flow freely
4. Either side can close connection

---

### Socket.io
**Definition**: A library that provides real-time, bidirectional communication between web clients and servers. Built on top of WebSockets with fallbacks.

**Why it matters**: Socket.io adds reliability features like automatic reconnection, room management, and fallback to HTTP long-polling if WebSockets aren't available.

**Key Concepts**:
- **Events**: Named messages (e.g., "edit", "cursor-move")
- **Rooms**: Logical groups of connections (e.g., all users in a session)
- **Namespaces**: Separate communication channels on one connection

---

### Pub/Sub (Publish/Subscribe)
**Definition**: A messaging pattern where senders (publishers) send messages to channels without knowing who will receive them, and receivers (subscribers) listen to channels without knowing who sent messages.

**Why it matters**: In a multi-server deployment, pub/sub (via Redis) ensures all server instances receive updates, so users connected to different servers stay in sync.

**Flow**:
```
User A (Server 1) → Edit → Redis Pub → Server 2 → User B
                                     → Server 3 → User C
```

---

### Redis
**Definition**: An in-memory data structure store used as a database, cache, and message broker.

**Our use cases**:
1. **Pub/Sub**: Broadcast Yjs updates across server instances
2. **Session Cache**: Store active session metadata for fast access
3. **Rate Limiting**: Track API usage per user

---

## Database & ORM

### Prisma
**Definition**: A next-generation ORM (Object-Relational Mapping) that provides type-safe database access for TypeScript/JavaScript.

**Why it matters**: Prisma generates a fully type-safe client from your schema, catching database errors at compile time instead of runtime.

**Key Features**:
- **Schema-first**: Define models in `schema.prisma`
- **Migrations**: Automatically generate SQL migrations
- **Type Safety**: Full TypeScript support with autocomplete

---

### Migration
**Definition**: A versioned change to your database schema (adding tables, columns, indexes, etc.).

**Why it matters**: Migrations allow you to evolve your database structure over time while keeping track of changes and enabling rollbacks.

**Workflow**:
```bash
1. Edit schema.prisma
2. Run: npx prisma migrate dev --name add_users
3. Prisma generates SQL and applies it
4. Commit migration files to git
```

---

### ORM (Object-Relational Mapping)
**Definition**: A technique for converting data between incompatible type systems (objects in code ↔ rows in database).

**Why it matters**: ORMs let you work with databases using your programming language's objects instead of writing raw SQL.

**Example**:
```typescript
// With ORM (Prisma)
const user = await prisma.user.create({ data: { name: "Alice" } });

// Without ORM (raw SQL)
const result = await db.query("INSERT INTO users (name) VALUES ($1)", ["Alice"]);
```

---

## Authentication

### OAuth
**Definition**: An open standard for access delegation, commonly used for token-based authentication and authorization.

**Why it matters**: OAuth lets users log in with existing accounts (GitHub, Google) without sharing passwords with your app.

**Flow (GitHub OAuth)**:
1. User clicks "Login with GitHub"
2. Redirected to GitHub authorization page
3. User approves, GitHub redirects back with code
4. Your server exchanges code for access token
5. Use token to fetch user info from GitHub API

---

### NextAuth.js
**Definition**: A complete authentication solution for Next.js applications.

**Why it matters**: NextAuth handles the complex OAuth flows, session management, and security best practices for you.

**Key Concepts**:
- **Providers**: Authentication methods (GitHub, Google, Email, etc.)
- **Session**: Stores authenticated user info
- **Callbacks**: Customize auth flow (e.g., save user to database)

---

### JWT (JSON Web Token)
**Definition**: A compact, URL-safe token format for securely transmitting information between parties as a JSON object.

**Structure**: `header.payload.signature`
- **Header**: Token type and algorithm
- **Payload**: Claims (user data)
- **Signature**: Verifies token hasn't been tampered with

**Why it matters**: JWTs are stateless (server doesn't need to store sessions) and can be verified without database lookups.

---

## AI & Code Review

### Prompt Engineering
**Definition**: The practice of designing inputs (prompts) to AI models to get desired outputs.

**Why it matters**: Well-crafted prompts significantly improve AI code review quality.

**Best Practices**:
- Be specific about what you want
- Provide context (language, framework)
- Use examples (few-shot learning)
- Set constraints (response format, length)

---

### Token
**Definition**: In AI context, a token is a piece of text (roughly 4 characters or ¾ of a word in English).

**Why it matters**: AI models have token limits (e.g., GPT-4 Turbo: 128k tokens). Pricing is per token.

**Example**: "Hello, world!" ≈ 4 tokens

---

### Rate Limiting
**Definition**: Controlling the rate at which users can make requests to an API.

**Why it matters**: Prevents abuse, controls costs (especially for paid APIs like OpenAI), and ensures fair resource distribution.

**Implementation**:
- **Per-user limits**: 10 AI reviews per hour
- **Global limits**: 1000 requests per minute across all users
- **Token bucket algorithm**: Allows bursts while maintaining average rate

---

## Testing

### End-to-End (E2E) Testing
**Definition**: Testing the complete flow of an application from start to finish, simulating real user behavior.

**Why it matters**: E2E tests catch integration issues that unit tests miss.

**Example**: Test that two users can join a session, edit code, and see each other's changes.

---

### Playwright
**Definition**: A framework for browser automation and testing that supports Chromium, Firefox, and WebKit.

**Why it matters**: Playwright can control multiple browsers simultaneously, perfect for testing real-time collaboration.

**Key Features**:
- **Multi-browser**: Test across Chrome, Firefox, Safari
- **Auto-wait**: Automatically waits for elements to be ready
- **Network interception**: Mock API responses
- **Screenshots/videos**: Visual debugging

---

## Deployment

### Serverless
**Definition**: A cloud computing model where the cloud provider manages server infrastructure, automatically scaling based on demand.

**Why it matters**: Serverless reduces operational overhead but has implications for stateful features like WebSockets.

**Challenges for our app**:
- WebSocket connections need persistent servers
- Solution: Use separate WebSocket server or serverless-compatible alternatives

---

### Environment Variables
**Definition**: Configuration values stored outside your code, typically for secrets and environment-specific settings.

**Why it matters**: Keeps secrets out of version control and allows different configs for dev/staging/production.

**Best Practices**:
- Never commit `.env` files
- Use `.env.example` to document required variables
- Use secret management in production (Vercel, AWS Secrets Manager)

---

### CI/CD (Continuous Integration/Continuous Deployment)
**Definition**: 
- **CI**: Automatically building and testing code on every commit
- **CD**: Automatically deploying code that passes tests

**Why it matters**: Catches bugs early and ensures consistent, reliable deployments.

**Our Pipeline**:
1. Push code to GitHub
2. GitHub Actions runs tests and linting
3. If tests pass, deploy to Vercel
4. Run smoke tests on deployed version

---

## Next.js Specific

### App Router
**Definition**: Next.js 13+ routing system based on the file system, using the `app/` directory.

**Why it matters**: App Router provides better performance, streaming, and React Server Components support.

**Key Concepts**:
- **Server Components**: Render on server by default (faster, smaller bundles)
- **Client Components**: Use `'use client'` directive for interactivity
- **Layouts**: Shared UI that doesn't re-render on navigation
- **Loading/Error States**: Built-in UI for async boundaries

---

### Server Actions
**Definition**: Functions that run on the server but can be called directly from client components.

**Why it matters**: Simplifies data mutations without creating API routes.

**Example**:
```typescript
// app/actions.ts
'use server'
export async function createSession(name: string) {
  return await prisma.codeSession.create({ data: { name } });
}

// app/page.tsx
'use client'
import { createSession } from './actions';
<button onClick={() => createSession('My Session')}>Create</button>
```

---

### Hydration
**Definition**: The process of attaching React event handlers to server-rendered HTML.

**Why it matters**: Next.js renders HTML on the server for fast initial load, then "hydrates" it on the client to make it interactive.

**Common Issue**: Hydration mismatch occurs when server and client render different content.

---

## Performance Concepts

### Debouncing
**Definition**: Delaying function execution until after a period of inactivity.

**Use case**: Sending AI review requests only after user stops typing for 500ms.

```typescript
const debouncedReview = debounce(() => requestAIReview(), 500);
```

---

### Throttling
**Definition**: Limiting function execution to once per time period.

**Use case**: Sending cursor position updates at most 10 times per second.

```typescript
const throttledCursorUpdate = throttle((pos) => sendCursor(pos), 100);
```

---

### Memoization
**Definition**: Caching function results based on inputs to avoid redundant calculations.

**Use case**: Caching AI review results for unchanged code.

```typescript
const memoizedReview = useMemo(() => 
  expensiveReviewCalculation(code), 
  [code]
);
```

---

This glossary covers the core concepts. For deeper dives, see the technology-specific guides in `docs/concepts/`.
