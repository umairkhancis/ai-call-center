# 🤖 AI Call Center - WebSocket Communication System

A TypeScript-based WebSocket communication system designed to be easily migrated to WebRTC. Features robust abstractions, verbose logging, and comprehensive type safety.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Available Commands](#-available-commands)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Build System](#-build-system)
- [Development Workflows](#-development-workflows)
- [Usage Examples](#-usage-examples)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Features](#-features)
- [Design Principles](#-design-principles)
- [WebRTC Migration](#-webrtc-migration)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ (recommended: 18+)
- npm (comes with Node.js)
- Modern web browser

### First-Time Setup

```bash
# 1. Clone the repository
git clone <your-repo>
cd ai-call-center

# 2. Setup everything (installs dependencies + builds)
npm run setup
```

This single command will:
1. Install all server dependencies
2. Install all client dependencies (including esbuild)
3. Build the server TypeScript
4. Generate the client browser bundle

### Running the Application

Open two terminal windows:

```bash
# Terminal 1 - Start WebSocket Server (port 8080)
npm run start:server
```

```bash
# Terminal 2 - Start Client Web Server (port 3001)
npm run start:client
```

Then open your browser to **http://localhost:3001** and click "Connect"!

### Get Help

```bash
npm run help
```

---

## 📜 Available Commands

### Setup & Installation

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run setup` | Install deps + build everything | First time, or after `git pull` |
| `npm run install:all` | Install all dependencies | Only if deps changed |

### Building

| Command | Description | Output |
|---------|-------------|--------|
| `npm run build:all` | Build server + client | Server: `dist/`, Client: `client-bundle.js` |
| `npm run build:server` | Build only server TypeScript | `server/dist/**/*.js` |
| `npm run build:client` | Build only client bundle | `client/client-bundle.js` (24KB) |

### Running Servers

| Command | Description | Port |
|---------|-------------|------|
| `npm run start:server` | Start WebSocket server (production) | 8080 |
| `npm run start:client` | Start client web server | 3001 |
| `npm run dev` | Run both servers (dev mode) | 8080 + 3001 |
| `npm run dev:server` | Run server with ts-node (auto-restart) | 8080 |
| `npm run dev:client` | Run client web server | 3001 |

### Testing

| Command | Description |
|---------|-------------|
| `npm run test` | Run all tests (server + client) |
| `npm run test:server` | Run only server tests |
| `npm run test:client` | Run only client tests |

### Cleaning

| Command | Description | What Gets Removed |
|---------|-------------|-------------------|
| `npm run clean` | Clean build artifacts | `server/dist/`, `client/dist/`, `client-bundle.js` |
| `npm run clean:all` | Nuclear clean | All of above + all `node_modules` |

### Help

| Command | Description |
|---------|-------------|
| `npm run help` | Display help with all commands |

---

## 📁 Project Structure

```
/ai-call-center/
├── client/                      # Browser-based TypeScript client
│   ├── src/
│   │   ├── app/
│   │   │   └── main.ts         # Main client application
│   │   └── communication/
│   │       ├── CommunicationManager.ts    # Abstract base class
│   │       └── WebSocketManager.ts        # WebSocket implementation
│   ├── build-bundle.js         # esbuild bundler script
│   ├── client-bundle.js        # Generated browser bundle (24KB)
│   ├── serve.js                # Express server for client
│   ├── index.html              # Client UI
│   └── package.json
│
├── server/                      # Node.js TypeScript server
│   ├── src/
│   │   ├── communication/
│   │   │   ├── CommunicationServer.ts     # Abstract base class
│   │   │   └── WebSocketServer.ts         # WebSocket implementation
│   │   └── server.ts           # Main server application
│   ├── dist/                   # Compiled JavaScript (generated)
│   └── package.json
│
├── shared/                      # Shared types and utilities
│   ├── types.ts                # Message types and interfaces
│   ├── config.ts               # Configuration
│   └── CommunicationFactory.ts # Protocol factory
│
├── tests/                       # Test files
│   ├── basic.test.ts
│   └── setup.ts
│
├── package.json                # Root package with unified commands
└── README.md                   # This file
```

---

## 🏗️ Architecture

### Core Components

The system uses clean separation between transport protocols and application logic:

#### Abstract Base Classes

- **`CommunicationManager`** (Client): Abstract interface for client-side communication
- **`CommunicationServer`** (Server): Abstract interface for server-side communication

These abstractions allow easy switching between WebSocket and WebRTC without changing application logic.

#### Current Implementation

- **WebSocket Implementation**: Full-featured WebSocket transport layer
- **Shared Types**: Consistent message format across client and server
- **Factory Pattern**: Easy protocol switching via `CommunicationFactory`
- **Browser Bundle**: Client code bundled with esbuild for browser compatibility

### Message Format

All messages follow a standardized JSON structure:

```typescript
interface Message {
  id: string;           // Unique message identifier (e.g., "msg_1234567890_abc123")
  type: MessageType;    // HANDSHAKE | DATA | COMMAND | STATUS | ERROR | HEARTBEAT
  timestamp: number;    // Unix timestamp in milliseconds
  sender: string;       // Sender identifier (client ID or "server")
  recipient: string;    // Recipient identifier (client ID, "server", or "all")
  payload: object;      // Message-specific data
  metadata?: object;    // Optional protocol-specific metadata
}
```

#### Message Types

```typescript
enum MessageType {
  HANDSHAKE = 'handshake',  // Initial connection handshake
  DATA = 'data',            // Regular data messages
  COMMAND = 'command',      // Command messages (e.g., status, ping)
  STATUS = 'status',        // Status updates
  ERROR = 'error',          // Error messages
  HEARTBEAT = 'heartbeat'   // Keep-alive messages
}
```

### Communication Flow

```
Browser Client                WebSocket                Server
     │                           │                        │
     ├──── connect() ───────────>│                        │
     │                           │<────── handshake ──────┤
     │                           │                        │
     ├──── sendMessage() ───────>│────── process ────────>│
     │                           │<───── response ────────┤
     │<─── onMessage() ──────────┤                        │
     │                           │                        │
     ├──── disconnect() ─────────>│────── cleanup ────────>│
```

---

## 🔨 Build System

### Overview

The project uses two different build processes:

| Aspect | Server | Client |
|--------|--------|--------|
| **Tool** | TypeScript (tsc) | esbuild |
| **Input** | `server/src/**/*.ts` | `client/src/app/main.ts` + imports |
| **Output** | Multiple files in `dist/` | Single `client-bundle.js` |
| **Target** | Node.js | Browser |
| **Module Format** | CommonJS/ES2020 | IIFE (Immediately Invoked Function Expression) |
| **Speed** | ~1-2 seconds | ~5-15 milliseconds ⚡ |

### Why Client Bundling is Required

The client **must** be bundled because:

1. **Browsers can't run TypeScript** - It must be compiled to JavaScript
2. **Browsers can't resolve Node.js modules** - `import` statements need to be bundled
3. **Single file requirement** - The HTML loads one file: `client-bundle.js`
4. **Dependency resolution** - All dependencies must be included

**Without the bundle:**
- Browser shows 404 error for `client-bundle.js`
- Application won't work
- You'll see "MIME type 'text/html' is not executable" errors

### Build Process Details

#### Server Build (`npm run build:server`)

```bash
npm run build:server
```

- **Input:** All TypeScript files in `server/src/`
- **Output:** Compiled JavaScript in `server/dist/`
- **Tool:** TypeScript Compiler (tsc)
- **Config:** `server/tsconfig.json`
- **Duration:** ~1-2 seconds

#### Client Build (`npm run build:client`)

```bash
npm run build:client
```

- **Input:** `client/src/app/main.ts` + all its imports
- **Output:** `client/client-bundle.js` (single 24KB file)
- **Tool:** esbuild (ultra-fast bundler)
- **Script:** `client/build-bundle.js`
- **Format:** IIFE for direct browser execution
- **Duration:** ~5-15 milliseconds ⚡

#### Build Everything

```bash
npm run build:all
```

Runs both builds in sequence:
1. Builds server TypeScript
2. Generates client browser bundle

---

## 🔄 Development Workflows

### 1. First Time Setup

```bash
git clone <repository>
cd ai-call-center
npm run setup
```

### 2. Daily Development

```bash
# Start both servers in development mode
npm run dev:server    # Terminal 1 (auto-restarts on changes)
npm run dev:client    # Terminal 2

# After changing client TypeScript files:
npm run build:client
# Then refresh your browser

# After changing server TypeScript files:
# (ts-node auto-restarts in dev mode, or rebuild manually)
npm run build:server
npm run start:server  # Restart if not using dev mode
```

### 3. After Pulling Code

Always rebuild after pulling new code:

```bash
git pull origin main
npm run setup    # Reinstalls deps and rebuilds everything
```

### 4. Running Tests

```bash
# Before committing
npm run test

# Or individually
npm run test:server
npm run test:client
```

### 5. Clean Slate

If things get weird, start fresh:

```bash
# Nuclear option - removes everything including node_modules
npm run clean:all
npm run setup
```

### 6. Production Build

```bash
# Build everything for production
npm run build:all

# Start servers
npm run start:server    # Terminal 1
npm run start:client    # Terminal 2
```

---

## 💻 Usage Examples

### Client Side Example

```typescript
import { WebSocketManager } from './communication/WebSocketManager';
import { createClientConfig } from '../shared/config';
import { MessageType } from '../shared/types';

// Initialize the WebSocket manager
const manager = new WebSocketManager(createClientConfig());

// Connect to server
await manager.connect('ws://localhost:8080');

// Send a message
await manager.sendMessage({
  type: MessageType.DATA,
  payload: { text: 'Hello Server!' }
});

// Listen for messages
manager.onMessage((message) => {
  console.log('Received:', message);
  console.log('Payload:', message.payload);
});

// Listen for connection changes
manager.onConnectionChange((connected) => {
  console.log('Connection status:', connected ? 'Connected' : 'Disconnected');
});

// Disconnect
await manager.disconnect();
```

### Server Side Example

```typescript
import { WebSocketServer } from './communication/WebSocketServer';
import { createServerConfig } from '../shared/config';
import { MessageType } from '../shared/types';

// Initialize the WebSocket server
const server = new WebSocketServer(createServerConfig());

// Start server
await server.start();
console.log('Server started on port 8080');

// Handle new client connections
server.onClientConnect((client) => {
  console.log(`New client connected: ${client.id}`);
  console.log(`IP: ${client.ip}`);
  console.log(`Total clients: ${server.clientCount}`);
});

// Handle client disconnections
server.onClientDisconnect((client) => {
  console.log(`Client disconnected: ${client.id}`);
});

// Handle incoming messages
server.onMessage(({ message, client }) => {
  console.log(`Message from ${client.id}:`, message.payload);

  // Echo back to client
  await server.sendToClient(client.id, {
    type: MessageType.DATA,
    payload: { 
      echo: message.payload.text,
      receivedAt: new Date().toISOString()
    }
  });
  
  // Or broadcast to all clients
  await server.broadcastMessage({
    type: MessageType.STATUS,
    payload: { 
      event: 'new_message',
      from: client.id 
    }
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
```

### Sending Different Message Types

```typescript
// Handshake message
await manager.sendMessage({
  type: MessageType.HANDSHAKE,
  payload: {
    clientId: manager.getClientId(),
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  }
});

// Command message
await manager.sendMessage({
  type: MessageType.COMMAND,
  payload: {
    command: 'status',
    params: {}
  }
});

// Heartbeat message
await manager.sendMessage({
  type: MessageType.HEARTBEAT,
  payload: {
    clientTime: Date.now()
  }
});
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run server tests only
npm run test:server

# Run client tests only
npm run test:client
```

### Test Structure

Tests are located in the `/tests` directory and cover:

- Message creation and validation
- Connection handling
- Message sending/receiving
- Error handling
- Disconnection scenarios

### Manual Testing

1. Start both servers
2. Open browser to http://localhost:3001
3. Open browser console (F12)
4. Click "Connect" button
5. Send test messages
6. Check both server console and browser console for logs

---

## 🔍 Debugging

### Logging

The application includes comprehensive verbose logging:

#### Server Console
- WebSocket server startup
- Client connections/disconnections
- Incoming/outgoing messages
- Error events
- Message processing details

#### Browser Console (F12)
- Connection status changes
- Message sending/receiving
- WebSocket events
- Error messages
- Client state changes

#### Network Tab (Browser DevTools)
- WebSocket connection details
- Frame inspection (WS tab)
- Connection timing
- Message payloads

### Debug Tips

1. **Enable verbose logging** - All components log events with detailed context
2. **Check Network tab** - Inspect WebSocket frames in browser DevTools
3. **Use `window.client`** - Client instance is exposed globally for debugging
4. **Check server logs** - Server logs all client events and messages
5. **Monitor connection state** - Use `manager.getConnectionState()`

---

## 🐛 Troubleshooting

### "client-bundle.js 404 Not Found"

**Problem:** The browser can't find the client bundle file.

**Cause:** The bundle hasn't been generated yet.

**Solution:**
```bash
npm run build:client
```

Then refresh your browser.

**Why this happens:** The client bundle must be generated from TypeScript source. The HTML file tries to load `client-bundle.js`, which doesn't exist until you build it.

---

### Servers Won't Start

**Problem:** Port already in use or other startup issues.

**Symptoms:**
- Error: "EADDRINUSE: address already in use"
- Server fails to start
- Port conflict messages

**Solution:**
```bash
# Check what's using the ports
lsof -i :8080
lsof -i :3001

# Kill existing processes
lsof -ti :8080,:3001 | xargs kill -9

# Rebuild and restart
npm run build:all
npm run start:server
npm run start:client
```

**Alternative:** Change the port in `shared/config.ts`

---

### Client Can't Connect to WebSocket

**Problem:** Browser can't establish WebSocket connection.

**Checklist:**
- ✅ Is the WebSocket server running? Check Terminal 1
- ✅ Is it on the correct port (8080)? Check server logs
- ✅ Are you accessing the right URL (http://localhost:3001)?
- ✅ Check browser console (F12) for error messages
- ✅ Check Network tab for WebSocket (WS) connections
- ✅ Is there a firewall blocking connections?

**Solution:**
```bash
# Restart the server
npm run start:server

# Check server logs for errors
# Check browser console for connection errors
```

---

### Module Not Found Errors

**Problem:** Dependencies are missing or out of sync.

**Symptoms:**
- "Cannot find module 'X'"
- Import errors
- Package not found

**Solution:**
```bash
# Nuclear option - fresh install
npm run clean:all    # Removes all node_modules
npm run setup        # Fresh install and build
```

---

### After Pulling Code from Git

**Problem:** Code updated but not working.

**Solution:** Always rebuild after pulling new code:
```bash
git pull origin main
npm run setup
```

This ensures:
- Dependencies are up to date
- New packages are installed
- Code is recompiled
- Bundles are regenerated

---

### TypeScript Compilation Errors

**Problem:** TypeScript won't compile.

**Solution:**
```bash
# Check for errors in server
npm run build:server

# Check for errors in client
npm run build:client
```

Review the error messages and fix the TypeScript issues. Common issues:
- Type mismatches
- Missing imports
- Incorrect type definitions

---

### Bundle is Outdated

**Problem:** Changes to client code not reflected in browser.

**Cause:** The bundle hasn't been regenerated.

**Solution:**
```bash
npm run build:client
```

Then **hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R).

**Remember:** Always rebuild the client bundle after changing TypeScript files.

---

### Port 8080 or 3001 Already in Use

**Problem:** Another process is using the required ports.

**Quick Solution:**
```bash
# Kill processes on both ports
lsof -ti :8080,:3001 | xargs kill -9
```

**Find what's using the port:**
```bash
lsof -i :8080
lsof -i :3001
```

---

### "MIME type 'text/html' is not executable"

**Problem:** Browser is receiving HTML instead of JavaScript for the bundle.

**Cause:** The `client-bundle.js` file doesn't exist, so the server returns an HTML error page.

**Solution:**
```bash
npm run build:client
```

---

## ✨ Features

### Currently Implemented

- ✅ **TypeScript with Strict Type Safety** - All code is strongly typed
- ✅ **Protocol Abstraction** - Clean interface for easy WebSocket → WebRTC migration
- ✅ **Verbose Logging** - Comprehensive debug information at every step
- ✅ **Real-time Communication** - Bidirectional WebSocket messaging
- ✅ **Connection Management** - Auto-reconnection, heartbeat, error handling
- ✅ **Message Types** - Handshake, Data, Command, Status, Error, Heartbeat
- ✅ **Multiple Client Support** - Server handles multiple concurrent connections
- ✅ **Echo & Broadcast** - Message echoing to sender and broadcasting to all clients
- ✅ **Browser Bundle** - Ultra-fast esbuild bundling (~15ms)
- ✅ **Express Web Server** - Serves client application with proper CORS headers
- ✅ **Graceful Shutdown** - Proper cleanup on server stop
- ✅ **Client Identification** - Unique ID generation for each client
- ✅ **Connection Events** - Track connect/disconnect events with full context
- ✅ **Message Validation** - JSON parsing with error handling
- ✅ **Reconnection Logic** - Automatic reconnection with configurable attempts

### Client Features

- WebSocket connection management
- Message sending/receiving
- Connection status monitoring
- Auto-reconnection with configurable retries
- Event-driven architecture
- Type-safe message handling
- Browser-based UI with real-time updates
- Message history display
- Connection state visualization

### Server Features

- WebSocket server on port 8080
- Multiple concurrent client support
- Client connection tracking
- Message broadcasting
- Per-client messaging
- Connection/disconnection events
- Message echo functionality
- Command processing
- Status reporting
- Error handling and reporting
- Graceful shutdown handling

---

## 📝 Design Principles

### 1. Simplicity First

Start with minimal working implementation, then extend. The current WebSocket implementation is intentionally simple and easy to understand.

### 2. Type Safety

Strict TypeScript throughout. Every interface, class, and function is fully typed:

```typescript
// Strong typing everywhere
interface Message { ... }
enum MessageType { ... }
abstract class CommunicationManager { ... }
```

### 3. Protocol Agnostic

All application logic works with any transport protocol. The abstraction layer ensures:

- Application code doesn't know about WebSocket/WebRTC details
- Switching protocols only requires changing the factory
- Message format stays the same
- No changes to application logic needed

### 4. Verbose Logging

Comprehensive debugging information at every step:

```typescript
console.info('[CLIENT] Connection state changed', { connected });
console.debug('[SERVER] Client connected', { clientId, ip });
```

Every event is logged with context for easy debugging.

### 5. Easy Migration

Clean separation between transport and application layers:

```
Application Logic (main.ts, server.ts)
        ↓
Abstract Interface (CommunicationManager, CommunicationServer)
        ↓
Implementation (WebSocketManager, WebSocketServer)
        ↓
Transport Protocol (WebSocket / WebRTC)
```

Changing the transport protocol doesn't affect application logic.

---

## 🎯 WebRTC Migration Path

The architecture is designed for easy migration from WebSocket to WebRTC.

### Current: WebSocket

```typescript
const manager = new WebSocketManager(config);
await manager.connect('ws://localhost:8080');
```

### Future: WebRTC

```typescript
const manager = new WebRTCManager(config);
await manager.connect(signalingServerUrl);
```

### Migration Steps

When ready to add WebRTC support:

1. **Create `WebRTCManager`** extending `CommunicationManager`
   - Implement `connect()` using `RTCPeerConnection`
   - Implement `sendMessage()` using data channels
   - Implement event handlers

2. **Create `WebRTCServer`** extending `CommunicationServer`
   - Implement signaling server
   - Handle ICE candidates
   - Manage peer connections

3. **Update `CommunicationFactory`**
   ```typescript
   static createManager(config: CommunicationConfig) {
     switch(config.type) {
       case 'websocket':
         return new WebSocketManager(config);
       case 'webrtc':
         return new WebRTCManager(config);  // New!
     }
   }
   ```

4. **Same message format** - No changes to application logic!
   ```typescript
   // This code works with both WebSocket and WebRTC
   await manager.sendMessage({
     type: MessageType.DATA,
     payload: { text: 'Hello!' }
   });
   ```

5. **Add signaling** for WebRTC handshake
   - ICE candidate exchange
   - SDP offer/answer
   - Connection negotiation

### Benefits of This Approach

- ✅ No changes to application code
- ✅ Same message format
- ✅ Same API interface
- ✅ Easy A/B testing
- ✅ Can support both protocols simultaneously
- ✅ Gradual migration path

---

## 🤝 Contributing

### Guidelines

1. **Follow existing TypeScript patterns**
   - Use strict typing
   - Define interfaces before implementations
   - Use abstract classes for protocols

2. **Add verbose logging**
   - Log all events with context
   - Use appropriate log levels (info, debug, warn, error)
   - Include relevant data in logs

3. **Update tests**
   - Add tests for new features
   - Ensure existing tests pass
   - Test edge cases

4. **Maintain protocol abstraction**
   - Keep transport logic separate from application logic
   - Use abstract interfaces
   - Don't leak implementation details

5. **Run tests before committing**
   ```bash
   npm run test
   ```

### Development Workflow

1. Create feature branch
2. Make changes
3. Run tests
4. Build everything
5. Test manually
6. Commit changes

---

## 📄 License

MIT

---

## 🆘 Getting Help

### Available Resources

- Run `npm run help` to see all available commands
- Check this README for comprehensive documentation
- Review `claude.md` for architecture and design principles
- Check browser console (F12) for client-side logs
- Check terminal for server-side logs

### Common Issues

1. **404 for client-bundle.js** → Run `npm run build:client`
2. **Port in use** → Kill process: `lsof -ti :8080,:3001 | xargs kill -9`
3. **Can't connect** → Ensure server is running on port 8080
4. **Module not found** → Run `npm run clean:all && npm run setup`
5. **After git pull** → Run `npm run setup`

---

**✨ Ready to communicate! 🚀**

The system is designed with verbose logging - check both terminal and browser console for detailed event information.