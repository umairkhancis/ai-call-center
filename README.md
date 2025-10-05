# 🤖 AI Call Center - WebSocket Communication System

A TypeScript-based WebSocket communication system designed to be easily migrated to WebRTC. Features robust abstractions, verbose logging, and comprehensive type safety.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser

### 1. Install Dependencies

```bash
# Install all dependencies (server + client)
npm run install:all
```

### 2. Start Development Environment

**Option A - Start Both Servers (Recommended):**
```bash
npm run dev
```

**Option B - Start Servers Individually:**
```bash
# Terminal 1 - Start WebSocket Server
npm run dev:server

# Terminal 2 - Start Client Server
npm run dev:client
```

### 3. Open Client Application

Open your browser and navigate to: `http://localhost:3001`

## 📋 Features

### ✅ Implemented
- **TypeScript with Strict Type Safety** - All code is strongly typed
- **Protocol Abstraction** - Easy WebSocket → WebRTC migration path
- **Verbose Logging** - Comprehensive debug information
- **Real-time Communication** - Bidirectional WebSocket messaging
- **Connection Management** - Auto-reconnection, heartbeat, error handling
- **Message Types** - Handshake, Data, Command, Status, Error, Heartbeat
- **Multiple Client Support** - Server handles multiple concurrent connections
- **Echo & Broadcast** - Message echoing and broadcasting capabilities

### 🔮 Future WebRTC Migration
- Abstract base classes ready for WebRTC implementation
- Same message format will work with WebRTC data channels
- Factory pattern for protocol switching
- No application logic changes needed for migration

## 🏗️ Architecture

The system uses a clean separation between transport protocols and application logic:

- **Abstract Base Classes**: `CommunicationManager` and `CommunicationServer` provide protocol-agnostic interfaces
- **WebSocket Implementation**: Current transport layer with comprehensive logging
- **Shared Types**: Consistent message format across client and server
- **Factory Pattern**: Easy switching between transport protocols
- **Browser Bundle**: Client code packaged for browser compatibility

## 📨 Message Format

All messages follow a standardized JSON structure:

```typescript
interface Message {
  id: string;           // Unique message identifier
  type: MessageType;    // HANDSHAKE | DATA | COMMAND | STATUS | ERROR | HEARTBEAT
  timestamp: number;    // Unix timestamp
  sender: string;       // Sender identifier
  recipient: string;    // Recipient identifier
  payload: object;      // Message-specific data
  metadata?: object;    // Protocol-specific metadata
}
```

## ⚡ Development Workflow

### Quick Commands

```bash
# Start everything
npm run dev

# Start only WebSocket server
npm run dev:server

# Start only client server
npm run dev:client

# Build everything
npm run build

# Clean build artifacts
npm run clean

# Run tests
npm run test

# Get help
npm run help
```

### Manual Development

If you prefer individual control:

```bash
# Server development (with ts-node)
cd server && npm run dev

# Client development (watch TypeScript)
cd client && npm run dev

# Client server (Express)
cd client && npm run serve
```

### Project Structure

```
/ai-call-center/
├── client/                 # Browser-based TypeScript client
│   ├── src/               # TypeScript source files
│   ├── serve.js           # Express server for client
│   ├── client-bundle.js   # Browser-compatible bundle
│   └── index.html         # Client interface
├── server/                # Node.js TypeScript server
│   └── src/               # TypeScript source files
├── shared/                # Shared types and utilities
├── dev-start.js          # Development environment starter
└── package.json          # Root package with unified commands
```

## 🔧 Usage Examples

### Client Side

```typescript
import { WebSocketManager } from './communication/WebSocketManager';
import { createClientConfig } from '../shared/config';

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
  console.log('Received:', message.payload);
});
```

### Server Side

```typescript
import { WebSocketServer } from './communication/WebSocketServer';
import { createServerConfig } from '../shared/config';

const server = new WebSocketServer(createServerConfig());

// Start server
await server.start();

// Handle client messages
server.onMessage(({ message, client }) => {
  console.log(`Message from ${client.id}:`, message.payload);

  // Echo back to client
  await server.sendToClient(client.id, {
    type: MessageType.DATA,
    payload: { echo: message.payload.text }
  });
});
```

## 🧪 Testing

Run tests for both client and server:

```bash
# Run all tests
npm run test

# Or run individually
cd server && npm test
cd client && npm test
```

## 🔍 Debugging

The application includes comprehensive logging:

- **Server Console**: Detailed WebSocket server events and message handling
- **Browser Console**: Client-side connection status and message flow
- **Network Tab**: WebSocket frame inspection in browser DevTools

## 🎯 WebRTC Migration Path

When ready to migrate to WebRTC:

1. **Create WebRTCManager** extending CommunicationManager
2. **Create WebRTCServer** extending CommunicationServer
3. **Update factory** to return WebRTC implementations
4. **Same message format** - no application logic changes needed
5. **Add signaling server** for WebRTC handshake process

## 📝 Key Design Principles

- **Simplicity First** - Start with minimal working implementation
- **Type Safety** - Strict TypeScript throughout
- **Protocol Agnostic** - All application logic works with any transport
- **Verbose Logging** - Comprehensive debugging information
- **Easy Migration** - Clean separation between transport and application layers

## 🐛 Troubleshooting

### Servers won't start
- Check if ports are available: `lsof -i :8080` and `lsof -i :3001`
- Kill existing processes: `lsof -ti :8080,:3001 | xargs kill -9`
- Verify Node.js version: `node --version` (should be 18+)
- Try starting manually: `npm run dev:server` and `npm run dev:client` separately

### Client can't connect to WebSocket
- Ensure WebSocket server is running on port 8080
- Check browser console for connection errors
- Verify client is accessing `http://localhost:3001` (not 3000)
- Test WebSocket connection in browser DevTools Network tab

### Development workflow issues
- Dependencies not installed: `npm run install:all`
- TypeScript errors: Check both `server/` and `client/` for compilation issues
- Bundle not working: Check `client/client-bundle.js` exists and loads properly
- Port conflicts: Use `npm run dev` to automatically handle port cleanup

### Express server issues
- Module not found errors: Ensure `npm install` was run in client directory
- Static files not served: Check `client/serve.js` configuration
- CORS errors: Verify CORS headers are set in `serve.js`

## 🤝 Contributing

1. Follow existing TypeScript patterns
2. Add verbose logging to new features
3. Update tests for new functionality
4. Maintain protocol abstraction principles

---

**Ready to communicate! 🚀**

The system is now running with verbose logging. Check both terminal windows and browser console for detailed event information.