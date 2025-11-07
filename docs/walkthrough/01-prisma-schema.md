# Walkthrough: Prisma Schema (`prisma/schema.prisma`)

## File Purpose
This file defines the database schema for our application using Prisma's declarative syntax. It specifies all tables (models), their columns (fields), relationships, and constraints.

## Execution Order
1. **Development**: You edit this file to define your data model
2. **Migration**: Run `npx prisma migrate dev` to generate SQL and apply to database
3. **Generation**: Prisma generates TypeScript client code in `node_modules/@prisma/client`
4. **Runtime**: Your application imports and uses the generated Prisma Client

## Complete File with Line-by-Line Explanation

```prisma
// Line 1-2: Schema metadata comment
// Prisma schema for Real-Time Code Collaboration Platform
// This defines our database structure using Prisma's declarative syntax

// Lines 4-6: Generator configuration
generator client {
  provider = "prisma-client-js"  // Generate JavaScript/TypeScript client
}
```
**Explanation**: The `generator` block tells Prisma to generate a JavaScript/TypeScript client. This client will be auto-generated in `node_modules/@prisma/client` and provides type-safe database access.

```prisma
// Lines 8-11: Datasource configuration
datasource db {
  provider = "postgresql"           // We're using PostgreSQL database
  url      = env("DATABASE_URL")    // Connection string from .env file
}
```
**Explanation**: The `datasource` block specifies:
- **provider**: Which database we're using (PostgreSQL, MySQL, SQLite, etc.)
- **url**: Connection string loaded from environment variable `DATABASE_URL`

Example `DATABASE_URL`: `postgresql://user:password@localhost:5432/collab_db?schema=public`

---

### User Model

```prisma
// Lines 13-26: User model - stores authenticated user information
model User {
  id            String    @id @default(cuid())
  // @id: This field is the primary key
  // @default(cuid()): Auto-generate a CUID (Collision-resistant Unique ID)
  
  name          String?   // ? means optional (nullable)
  email         String?   @unique  // @unique: No two users can have same email
  emailVerified DateTime? // When email was verified (for email auth)
  image         String?   // Profile picture URL
  createdAt     DateTime  @default(now())  // Auto-set to current time on creation
  updatedAt     DateTime  @updatedAt       // Auto-update on any change

  // Relations - these don't create columns, they define relationships
  accounts      Account[]        // One user can have many accounts (GitHub, Google, etc.)
  sessions      Session[]        // One user can have many sessions (auth sessions)
  ownedSessions CodeSession[] @relation("SessionOwner")  // Sessions this user created
  participants  Participant[]    // Sessions this user has joined

  @@map("users")  // Map this model to "users" table in database
}
```

**Key Concepts**:
- **Primary Key** (`@id`): Uniquely identifies each row
- **CUID** (`cuid()`): Better than UUID for databases (sortable, shorter)
- **Optional Fields** (`?`): Can be null in database
- **Unique Constraint** (`@unique`): Database enforces uniqueness
- **Auto-timestamps**: `@default(now())` and `@updatedAt` are automatic
- **Relations**: Define connections to other models (explained in detail below)

---

### Account Model (OAuth Providers)

```prisma
// Lines 28-45: Account model - OAuth provider accounts
model Account {
  id                String  @id @default(cuid())
  userId            String  // Foreign key to User
  type              String  // "oauth", "email", etc.
  provider          String  // "github", "google", etc.
  providerAccountId String  // User's ID on the provider's system
  
  // OAuth tokens - stored as TEXT for large values
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?    // Token expiration timestamp
  token_type        String? // "Bearer", etc.
  scope             String? // OAuth scopes granted
  id_token          String? @db.Text  // OpenID Connect ID token
  session_state     String?

  // Relation to User
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  // fields: [userId] - This model's foreign key column
  // references: [id] - The User model's primary key
  // onDelete: Cascade - If user is deleted, delete their accounts too

  @@unique([provider, providerAccountId])  // Composite unique constraint
  // A user can't have two accounts with same provider + providerAccountId
  
  @@map("accounts")
}
```

**Key Concepts**:
- **Foreign Key**: `userId` links to `User.id`
- **@db.Text**: Store large text (tokens can be long)
- **Composite Unique**: Combination of two fields must be unique
- **Cascade Delete**: Deleting parent (User) deletes children (Accounts)

**Why separate Account model?**
- One user can have multiple OAuth providers (GitHub + Google)
- Stores provider-specific data (tokens, scopes)
- Follows NextAuth.js adapter pattern

---

### Session Model (Auth Sessions)

```prisma
// Lines 47-56: Session model - NextAuth session management
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique  // Token stored in user's cookie
  userId       String   // Which user this session belongs to
  expires      DateTime // When this session expires
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

**Explanation**: This stores active authentication sessions. When you log in:
1. NextAuth creates a Session record
2. Stores `sessionToken` in your browser cookie
3. On each request, cookie is validated against this table
4. If expired or not found, you're logged out

---

### CodeSession Model (Collaborative Sessions)

```prisma
// Lines 58-80: CodeSession model - represents a collaborative coding session
model CodeSession {
  id          String   @id @default(cuid())
  name        String   // Display name like "My React Project"
  description String?  // Optional description
  language    String   @default("javascript")  // Programming language
  isPublic    Boolean  @default(true)  // Public or private session
  ownerId     String   // Who created this session
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Yjs document state - stores the CRDT state as binary
  yjsState    Bytes?   @db.ByteA
  // Bytes: Binary data type
  // @db.ByteA: PostgreSQL's binary data type
  // This stores the entire Yjs document state for persistence
  
  // Last snapshot of the code (human-readable backup)
  lastSnapshot String? @db.Text
  // Plain text version of the code for easy viewing/searching
  
  // Relations
  owner        User          @relation("SessionOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  participants Participant[] // Who's in this session
  messages     ChatMessage[] // Chat messages in this session

  @@index([ownerId])    // Index for fast queries by owner
  @@index([createdAt])  // Index for sorting by creation date
  @@map("code_sessions")
}
```

**Key Concepts**:
- **Binary Data** (`Bytes`): Stores Yjs CRDT state efficiently
- **Indexes** (`@@index`): Speed up queries (trade-off: slower writes, faster reads)
- **Named Relation** (`@relation("SessionOwner")`): Disambiguates when multiple relations to same model

**Why store both yjsState and lastSnapshot?**
- `yjsState`: Efficient binary format for loading into Yjs
- `lastSnapshot`: Human-readable text for searching, previewing, backups

---

### Participant Model

```prisma
// Lines 82-99: Participant model - tracks who's in each session
model Participant {
  id        String   @id @default(cuid())
  sessionId String   // Which session
  userId    String   // Which user
  role      String   @default("editor")  // "owner", "editor", "viewer"
  joinedAt  DateTime @default(now())     // When they joined
  leftAt    DateTime?                    // When they left (null if still active)

  // Relations
  session CodeSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user    User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([sessionId, userId])  // A user can only be in a session once
  @@index([sessionId])           // Fast lookup of all participants in a session
  @@index([userId])              // Fast lookup of all sessions a user is in
  @@map("participants")
}
```

**Explanation**: This is a **join table** (many-to-many relationship):
- Many users can be in many sessions
- Tracks when users join/leave
- Stores role for permissions

**Active participants query**:
```typescript
const active = await prisma.participant.findMany({
  where: { sessionId: 'abc', leftAt: null }
});
```

---

### ChatMessage Model

```prisma
// Lines 101-114: ChatMessage model - stores chat messages within sessions
model ChatMessage {
  id        String   @id @default(cuid())
  sessionId String   // Which session this message belongs to
  userId    String   // Who sent it
  userName  String   // Denormalized for performance
  // Denormalized: We store userName here even though it's in User table
  // Why? Faster queries - don't need to join User table every time
  // Trade-off: If user changes name, old messages keep old name
  
  message   String   @db.Text  // The actual message content
  createdAt DateTime @default(now())

  // Relation
  session CodeSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])  // Composite index for efficient message fetching
  // Allows fast queries like: "Get all messages in session X, sorted by time"
  
  @@map("chat_messages")
}
```

**Denormalization Trade-off**:
- **Pro**: Faster reads (no join needed)
- **Con**: Data duplication, potential inconsistency
- **When to use**: Read-heavy data that rarely changes

---

## Relationship Types Explained

### One-to-Many
```prisma
model User {
  id       String        @id
  sessions CodeSession[] // One user has many sessions
}

model CodeSession {
  id      String @id
  ownerId String
  owner   User   @relation(fields: [ownerId], references: [id])
  // One session has one owner
}
```

### Many-to-Many (via Join Table)
```prisma
model User {
  id           String        @id
  participants Participant[] // User can be in many sessions
}

model CodeSession {
  id           String        @id
  participants Participant[] // Session can have many users
}

model Participant {
  userId    String
  sessionId String
  user      User        @relation(...)
  session   CodeSession @relation(...)
}
```

---

## Common Prisma Commands

### Generate Client
```bash
npx prisma generate
```
Generates TypeScript client in `node_modules/@prisma/client`

### Create Migration
```bash
npx prisma migrate dev --name add_users
```
Creates SQL migration file and applies it to database

### Apply Migrations (Production)
```bash
npx prisma migrate deploy
```
Applies pending migrations without prompts

### Reset Database
```bash
npx prisma migrate reset
```
Drops database, recreates it, applies all migrations

### Open Database GUI
```bash
npx prisma studio
```
Opens web UI to view/edit data

---

## Type-Safe Queries with Generated Client

After running `prisma generate`, you get a fully typed client:

```typescript
import prisma from '@/lib/prisma';

// Create a user
const user = await prisma.user.create({
  data: {
    name: 'Alice',
    email: 'alice@example.com',
  },
});

// Find users with relations
const users = await prisma.user.findMany({
  include: {
    ownedSessions: true,  // Include related sessions
    participants: {
      include: {
        session: true,  // Nested include
      },
    },
  },
  where: {
    email: {
      contains: '@example.com',  // Filter
    },
  },
  orderBy: {
    createdAt: 'desc',  // Sort
  },
  take: 10,  // Limit
});

// Update
await prisma.user.update({
  where: { id: user.id },
  data: { name: 'Alice Smith' },
});

// Delete
await prisma.user.delete({
  where: { id: user.id },
});
```

All of this is **fully type-checked** by TypeScript!

---

## Common Patterns

### Upsert (Update or Insert)
```typescript
await prisma.participant.upsert({
  where: {
    sessionId_userId: { sessionId: 'abc', userId: '123' },
  },
  create: {
    sessionId: 'abc',
    userId: '123',
    role: 'editor',
  },
  update: {
    leftAt: null,  // Mark as active again
  },
});
```

### Transactions
```typescript
await prisma.$transaction([
  prisma.user.create({ data: { name: 'Alice' } }),
  prisma.user.create({ data: { name: 'Bob' } }),
]);
// Both succeed or both fail
```

### Raw SQL (when needed)
```typescript
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE name LIKE ${'%Alice%'}
`;
```

---

## Next Steps

1. **Read**: [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
2. **Practice**: Modify the schema to add a new model (e.g., `Tag` for sessions)
3. **Explore**: Run `npx prisma studio` to see your data visually

---

## Related Files
- `lib/prisma.ts` - Prisma Client singleton
- `app/api/sessions/route.ts` - Uses Prisma to query sessions
- `server/socket-server.ts` - Uses Prisma to persist Yjs state
