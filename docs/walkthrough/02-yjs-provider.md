# Walkthrough: Yjs Socket.io Provider (`lib/yjs/provider.ts`)

## File Purpose
This file creates a custom Yjs provider that uses Socket.io for real-time synchronization. It's the bridge between Yjs (CRDT library) and Socket.io (WebSocket library), enabling multiple users to edit the same document simultaneously.

## When This Runs
- **Client-side only** (marked with `'use client'`)
- Instantiated when a user opens the editor page
- Lives for the duration of the editing session
- Destroyed when user leaves the page

## Execution Flow
```
User opens editor page
  → SessionPage component mounts
    → CollaborativeEditor component creates SocketIOProvider
      → Provider connects to Socket.io server
      → Provider requests initial document state
      → Provider sets up bidirectional sync
        → Local changes → Socket.io → Other clients
        → Remote changes → Socket.io → Local document
```

## Complete File with Line-by-Line Explanation

### Imports and Setup

```typescript
// Lines 1-10: File header and purpose documentation
/**
 * Yjs Provider for Socket.io
 * 
 * This file creates a custom Yjs provider that uses Socket.io for real-time synchronization.
 * It handles:
 * - Sending local Yjs updates to the server via Socket.io
 * - Receiving remote updates from other clients
 * - Managing awareness (cursor positions, user info)
 */

'use client';
// This directive tells Next.js this code runs ONLY in the browser
// Required because:
// 1. Socket.io client needs browser APIs (WebSocket)
// 2. Yjs uses browser-specific features
// 3. We're managing client-side state
```

```typescript
// Lines 12-14: Import dependencies
import * as Y from 'yjs';
// Y is the Yjs library namespace
// Provides: Y.Doc (document), Y.Text (text type), Y.applyUpdate (apply changes)

import { TypedSocket } from '../socket';
// Our custom Socket.io client with TypeScript types
// Ensures type-safe event emission and listening

import * as awarenessProtocol from 'y-protocols/awareness';
// Awareness protocol for tracking user presence (cursors, selections, names)
// Separate from document content - ephemeral data that doesn't need persistence
```

**Why separate awareness from document?**
- Document content: Needs to be persisted, conflict-resolved, versioned
- Awareness: Temporary, doesn't need history, can be lost without issues

---

### Class Definition and Constructor

```typescript
// Lines 16-23: Class definition and properties
export class SocketIOProvider {
  public doc: Y.Doc;
  // The Yjs document we're synchronizing
  // Contains all shared data types (Y.Text, Y.Map, etc.)
  
  public awareness: awarenessProtocol.Awareness;
  // Tracks ephemeral user state (cursor position, selection, user info)
  
  private socket: TypedSocket;
  // Socket.io connection to the server
  
  private sessionId: string;
  // Which collaborative session we're in
  
  private synced: boolean = false;
  // Have we received initial state from server?
  // Prevents duplicate sync requests
```

```typescript
  // Lines 25-38: Constructor - initializes the provider
  constructor(sessionId: string, doc: Y.Doc, socket: TypedSocket) {
    this.sessionId = sessionId;
    this.doc = doc;
    this.socket = socket;
    
    // Create awareness instance for tracking user cursors/selections
    this.awareness = new awarenessProtocol.Awareness(doc);
    // Awareness is tied to a document but manages separate state
    // Each client has a unique clientID in the awareness

    // Set up event listeners
    this.setupDocumentListeners();
    // Listen for local document changes → broadcast to others
    
    this.setupSocketListeners();
    // Listen for remote updates → apply to local document
    
    this.setupAwarenessListeners();
    // Listen for local awareness changes → broadcast to others

    // Request initial sync from server
    this.requestSync();
    // Ask server for current document state
  }
```

**Constructor Flow**:
1. Store references (sessionId, doc, socket)
2. Create awareness instance
3. Set up 3 types of listeners (document, socket, awareness)
4. Request initial state from server

---

### Document Listeners (Local → Remote)

```typescript
  // Lines 40-52: Set up listeners for local document changes
  private setupDocumentListeners() {
    // Listen for updates to the Yjs document
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      // update: Binary representation of the change
      // origin: Who made this change? (used to prevent echo)
      
      // Don't broadcast updates that came from the network (origin === this)
      // Only broadcast updates that originated locally
      if (origin !== this) {
        this.socket.emit('yjs-update', this.sessionId, update);
        // Send to server, which will broadcast to other clients
      }
    });
  }
```

**Key Concept: Origin Parameter**

The `origin` parameter prevents infinite loops:

```
Without origin check:
User types "A"
  → Local doc emits 'update' event
    → Send to server
      → Server broadcasts to all clients (including us!)
        → We receive our own update
          → Apply to doc
            → Doc emits 'update' event
              → Send to server again
                → INFINITE LOOP! 💥

With origin check:
User types "A"
  → Local doc emits 'update' event (origin = undefined)
    → origin !== this, so send to server
      → Server broadcasts
        → We receive update
          → Apply with origin = this
            → Doc emits 'update' event (origin = this)
              → origin === this, so DON'T send to server ✅
```

**What is `Uint8Array`?**
- Binary array of 8-bit unsigned integers (0-255)
- Efficient way to represent Yjs updates
- Much smaller than JSON for large documents
- Example: `[1, 2, 3, 255, 0, 128]`

---

### Socket Listeners (Remote → Local)

```typescript
  // Lines 54-80: Set up listeners for remote updates from Socket.io
  private setupSocketListeners() {
    // Receive Yjs updates from other clients
    this.socket.on('yjs-update', (update: Uint8Array) => {
      // Apply the update to our local document
      // Pass 'this' as origin to prevent re-broadcasting
      Y.applyUpdate(this.doc, update, this);
      // Y.applyUpdate merges the remote change into our document
      // CRDT magic ensures no conflicts!
    });
```

**How Y.applyUpdate Works**:
```
Local doc state: "Hello"
Remote update: Insert "World" at position 5
Y.applyUpdate(doc, update, origin)
  → Yjs CRDT algorithm merges changes
  → Local doc state: "HelloWorld"
  → Emits 'update' event (with origin = this)
```

```typescript
    // Receive awareness updates (cursor positions, etc.)
    this.socket.on('yjs-awareness', (update: Uint8Array) => {
      awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);
      // Similar to document updates, but for awareness state
      // Updates our local awareness map with remote user info
    });
```

**Awareness Update Example**:
```javascript
// Remote user moves cursor to line 5, column 10
const awarenessUpdate = encodeAwarenessUpdate(awareness, [clientID]);
// Binary: [clientID, { cursor: { line: 5, column: 10 } }]

// We receive and apply it
applyAwarenessUpdate(this.awareness, awarenessUpdate);
// Now we can render their cursor at that position
```

```typescript
    // Handle connection events
    this.socket.on('connect', () => {
      console.log('SocketIOProvider: Connected, requesting sync');
      this.requestSync();
      // When we reconnect (e.g., after network interruption), request full state
    });

    this.socket.on('disconnect', () => {
      console.log('SocketIOProvider: Disconnected');
      this.synced = false;
      // Mark as not synced so we request sync on reconnect
    });
  }
```

**Why request sync on reconnect?**
- While disconnected, we missed updates from other users
- Server has the authoritative state
- Requesting sync ensures we catch up

---

### Awareness Listeners (Local → Remote)

```typescript
  // Lines 82-103: Set up listeners for local awareness changes
  private setupAwarenessListeners() {
    // Listen for changes to local awareness state
    this.awareness.on('update', ({ added, updated, removed }: {
      added: number[];    // New clients that joined
      updated: number[];  // Clients whose state changed
      removed: number[];  // Clients that left
    }) => {
      // Create an awareness update message
      const changedClients = added.concat(updated).concat(removed);
      // Combine all changed client IDs
      
      const update = awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        changedClients
      );
      // Encode only the changed clients' states (efficient!)
      // Not the entire awareness map
      
      // Broadcast to other clients
      this.socket.emit('yjs-awareness', this.sessionId, update);
    });
  }
```

**Awareness Update Scenarios**:

1. **User moves cursor**:
   ```javascript
   awareness.setLocalState({ cursor: { line: 10, column: 5 } });
   // Triggers 'update' event with updated: [myClientID]
   ```

2. **User joins**:
   ```javascript
   awareness.setLocalState({ user: { name: 'Alice', color: '#ff0000' } });
   // Triggers 'update' event with added: [myClientID]
   ```

3. **User leaves**:
   ```javascript
   awareness.destroy();
   // Triggers 'update' event with removed: [myClientID]
   ```

---

### Sync Request

```typescript
  // Lines 105-110: Request full document sync from server
  private requestSync() {
    this.socket.emit('request-sync', this.sessionId);
    // Ask server to send us the current document state
    // Server will respond with a 'yjs-update' containing full state
    
    this.synced = true;
    // Mark as synced (will be set to false on disconnect)
  }
```

**Sync Flow**:
```
Client                          Server
  |                               |
  |--- request-sync(sessionId) -->|
  |                               | Load Yjs doc from memory/DB
  |                               | Encode full state
  |<-- yjs-update(fullState) -----|
  | Apply full state              |
  | Now in sync!                  |
```

---

### Public API Methods

```typescript
  // Lines 112-118: Set local user's awareness state
  public setAwarenessField(field: string, value: unknown) {
    const currentState = this.awareness.getLocalState() || {};
    // Get our current awareness state (or empty object if none)
    
    this.awareness.setLocalState({
      ...currentState,
      [field]: value,
    });
    // Merge new field with existing state
    // Example: setAwarenessField('cursor', { line: 5, column: 10 })
    // Result: { user: {...}, cursor: { line: 5, column: 10 } }
  }
```

**Usage Example**:
```typescript
provider.setAwarenessField('user', {
  name: 'Alice',
  color: '#ff0000'
});

provider.setAwarenessField('cursor', {
  line: 10,
  column: 5
});

// Awareness state: { user: { name: 'Alice', color: '#ff0000' }, cursor: { line: 10, column: 5 } }
```

```typescript
  // Lines 120-124: Get all users' awareness states
  public getAwarenessStates(): Map<number, Record<string, unknown>> {
    return this.awareness.getStates();
    // Returns a Map: clientID → awareness state
    // Example: Map {
    //   123 => { user: { name: 'Alice', color: '#ff0000' }, cursor: { line: 5, column: 10 } },
    //   456 => { user: { name: 'Bob', color: '#00ff00' }, cursor: { line: 8, column: 3 } }
    // }
  }
```

**Rendering Remote Cursors**:
```typescript
const states = provider.getAwarenessStates();
states.forEach((state, clientID) => {
  if (clientID !== awareness.clientID) { // Don't render our own cursor
    const { user, cursor } = state;
    renderCursor(cursor.line, cursor.column, user.name, user.color);
  }
});
```

```typescript
  // Lines 126-131: Cleanup and disconnect
  public destroy() {
    this.awareness.destroy();
    // Clean up awareness (removes local state, notifies others)
    
    this.doc.off('update', () => {});
    // Remove document update listener
    
    this.socket.off('yjs-update');
    this.socket.off('yjs-awareness');
    // Remove socket listeners
  }
```

**When to call destroy()**:
```typescript
useEffect(() => {
  const provider = new SocketIOProvider(sessionId, doc, socket);
  
  return () => {
    provider.destroy(); // Cleanup on component unmount
  };
}, []);
```

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Types "A"                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Monaco Editor                               │
│  - Captures keystroke                                           │
│  - Updates editor buffer                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MonacoBinding                               │
│  - Converts Monaco change to Yjs operation                      │
│  - Applies to Y.Text                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Y.Doc (Local)                               │
│  - Emits 'update' event                                         │
│  - Includes: update (Uint8Array), origin (undefined)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SocketIOProvider.setupDocumentListeners         │
│  - Checks: origin !== this? YES                                 │
│  - Emits: socket.emit('yjs-update', sessionId, update)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Socket.io Client                            │
│  - Sends update to server over WebSocket                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Socket.io Server                            │
│  - Receives 'yjs-update' event                                  │
│  - Applies to server's Y.Doc                                    │
│  - Broadcasts to all clients in session (except sender)         │
│  - Publishes to Redis for other server instances                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Other Clients' Socket.io                       │
│  - Receive 'yjs-update' event                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             SocketIOProvider.setupSocketListeners               │
│  - Calls: Y.applyUpdate(doc, update, this)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Y.Doc (Remote Client)                       │
│  - Merges update using CRDT algorithm                           │
│  - Emits 'update' event (origin = this)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MonacoBinding                               │
│  - Converts Yjs change to Monaco operation                      │
│  - Updates Monaco editor                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Monaco Editor                               │
│  - Displays "A" in remote user's editor                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## CRDT Magic: How Conflicts Are Resolved

### Scenario: Two Users Type Simultaneously

```
Initial state: "Hello"

User A (position 5): Types " World"
User B (position 0): Types "Hi "

Without CRDT (traditional approach):
  - Last write wins
  - Result: Either "Hi Hello" OR "Hello World"
  - One user's edit is lost! ❌

With CRDT (Yjs):
  - Each operation has a unique ID (clientID + clock)
  - Operations are commutative (order doesn't matter)
  - Result: "Hi Hello World" ✅
  - Both edits preserved!
```

### How Yjs Achieves This

1. **Unique Operation IDs**:
   ```
   User A's operation: { clientID: 123, clock: 5, insert: " World", position: 5 }
   User B's operation: { clientID: 456, clock: 3, insert: "Hi ", position: 0 }
   ```

2. **Causal Ordering**:
   - Each client maintains a vector clock
   - Operations are applied in causal order
   - If operation A happened before B, A is applied first

3. **Deterministic Merge**:
   - Same operations + same order = same result
   - All clients converge to identical state
   - No central authority needed!

---

## Common Pitfalls and Solutions

### Pitfall 1: Creating Multiple Providers

```typescript
// ❌ BAD: Creates new provider on every render
function Editor() {
  const provider = new SocketIOProvider(sessionId, doc, socket);
  // ...
}

// ✅ GOOD: Create once, reuse
function Editor() {
  const [provider] = useState(() => new SocketIOProvider(sessionId, doc, socket));
  
  useEffect(() => {
    return () => provider.destroy();
  }, []);
}
```

### Pitfall 2: Forgetting to Destroy

```typescript
// ❌ BAD: Memory leak, socket stays open
function Editor() {
  const provider = new SocketIOProvider(sessionId, doc, socket);
  // Component unmounts, provider still running
}

// ✅ GOOD: Clean up
function Editor() {
  const [provider] = useState(() => new SocketIOProvider(sessionId, doc, socket));
  
  useEffect(() => {
    return () => provider.destroy(); // Cleanup
  }, []);
}
```

### Pitfall 3: Not Handling Reconnection

```typescript
// ❌ BAD: No reconnection logic
socket.on('disconnect', () => {
  // Do nothing
});

// ✅ GOOD: Request sync on reconnect
socket.on('connect', () => {
  this.requestSync(); // Catch up on missed updates
});
```

---

## Testing the Provider

### Manual Test: Two Browser Windows

1. Open two browser windows to the same session
2. Type in one window
3. Verify text appears in the other window
4. Type simultaneously in both
5. Verify no conflicts, both edits preserved

### Automated Test (Playwright)

```typescript
test('collaborative editing', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  await page1.goto('/session/test-session');
  await page2.goto('/session/test-session');
  
  // User 1 types
  await page1.locator('.monaco-editor').type('Hello');
  
  // Verify User 2 sees it
  await expect(page2.locator('.monaco-editor')).toContainText('Hello');
  
  // User 2 types
  await page2.locator('.monaco-editor').type(' World');
  
  // Verify User 1 sees it
  await expect(page1.locator('.monaco-editor')).toContainText('Hello World');
});
```

---

## Performance Considerations

### Update Frequency
- Yjs batches updates automatically (debounced)
- Don't manually debounce Yjs updates
- Socket.io handles backpressure

### Binary vs JSON
- Yjs updates are binary (Uint8Array)
- Much smaller than JSON for large documents
- Example: 1000-line document change = ~100 bytes

### Memory Usage
- Yjs stores full document history (for undo/redo)
- Can be garbage collected with `doc.gc = true`
- Trade-off: Lose undo history, save memory

---

## Next Steps

1. **Read**: [Yjs Documentation](https://docs.yjs.dev/)
2. **Experiment**: Add console.logs to see updates in real-time
3. **Extend**: Add undo/redo with `Y.UndoManager`

---

## Related Files
- `lib/socket.ts` - Socket.io client setup
- `components/Editor.tsx` - Uses this provider
- `server/socket-server.ts` - Server-side Socket.io handling
