# Project: Agentic AI Call Center

## Core Principles
**IMPORTANT**: Keep things simple - build minimal working implementations first, then extend.
**IMPORTANT**: Use TypeScript with strict type safety for all code.
**IMPORTANT**: Design all communication code with protocol abstraction in mind. The WebSocket implementation should be easily replaceable with WebRTC without changing the application logic.

## Development Workflow
1. Create feature branch: `feature-[feature-name]`
2. Start with minimal WebSocket implementation using TypeScript
3. Write type-safe interfaces before implementing classes
4. Write simple tests for core functionality
5. Ensure all communication goes through the abstraction layer
6. Test basic scenarios: connect, disconnect, send/receive messages

## Architecture Overview
- **Client App**: Browser-based TypeScript application (sender/initiator)
- **Server App**: Node.js TypeScript application (receiver/responder)
- **Communication Protocol**: WebSocket (easily replaceable with WebRTC)
- **Message Format**: Strongly-typed JSON with standardized message types
- **Connection Management**: Type-safe abstracted interface layer

## Application Requirements

### Client Application (Browser)
```typescript
// File: /client/src/communication/CommunicationManager.ts
// Abstract interface that will work for both WebSocket and WebRTC

export interface MessagePayload {
  [key: string]: any;
}

export interface Message {
  id: string;
  type: MessageType;
  timestamp: number;
  sender: string;
  recipient: string;
  payload: MessagePayload;
  metadata?: Record<string, any>;
}

export enum MessageType {
  HANDSHAKE = 'handshake',
  DATA = 'data',
  COMMAND = 'command',
  STATUS = 'status',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

export interface CommunicationConfig {
  type: 'websocket' | 'webrtc';
  serverUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export abstract class CommunicationManager {
  protected connectionType: 'websocket' | 'webrtc';
  protected eventHandlers: Map<string, Function[]>;
  protected connection: any;
  protected isConnected: boolean;

  constructor(config: CommunicationConfig) {
    this.connectionType = config.type;
    this.eventHandlers = new Map();
    this.connection = null;
    this.isConnected = false;
  }

  // Abstract methods that both protocols must implement
  abstract connect(target: string): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendMessage(message: Partial<Message>): Promise<void>;
  abstract onMessage(callback: (message: Message) => void): void;
  abstract onConnectionChange(callback: (connected: boolean) => void): void;

  protected emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}
```

### Server Application (Node.js)
```typescript
// File: /server/src/communication/CommunicationServer.ts
// Server that can handle both WebSocket and WebRTC connections

export interface ClientInfo {
  id: string;
  connection: any;
  ip?: string;
  connectedAt: Date;
}

export interface ServerConfig {
  protocol: 'websocket' | 'webrtc';
  port: number;
  heartbeatInterval?: number;
}

export abstract class CommunicationServer {
  protected protocol: 'websocket' | 'webrtc';
  protected clients: Set<ClientInfo>;
  protected messageHandlers: Map<string, Function[]>;
  protected port: number;

  constructor(config: ServerConfig) {
    this.protocol = config.protocol;
    this.clients = new Set();
    this.messageHandlers = new Map();
    this.port = config.port;
  }

  // Abstract methods for protocol handling
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract broadcastMessage(message: Partial<Message>): Promise<void>;
  abstract sendToClient(clientId: string, message: Partial<Message>): Promise<void>;
  abstract onClientConnect(callback: (client: ClientInfo) => void): void;
  abstract onClientDisconnect(callback: (client: ClientInfo) => void): void;
  abstract onMessage(callback: (message: Message, client: ClientInfo) => void): void;

  protected emit(event: string, data?: any): void {
    const handlers = this.messageHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  protected generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Message Format Standards
```typescript
// File: /shared/types.ts
// Shared types already defined above - keep simple, reuse existing interfaces

// Example message creation with type safety
const createMessage = (
  type: MessageType,
  payload: MessagePayload,
  sender: string,
  recipient: string = 'server'
): Message => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: Date.now(),
  sender,
  recipient,
  payload,
  metadata: {}
});
```

## WebSocket Implementation First

### Client WebSocket Implementation
```typescript
// File: /client/src/communication/WebSocketManager.ts
export class WebSocketManager extends CommunicationManager {
  private ws: WebSocket | null = null;
  private clientId: string;

  constructor(config: CommunicationConfig) {
    super(config);
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(serverUrl);
      this.connection = this.ws;

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connected');
        resolve();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: Message = JSON.parse(event.data);
          this.emit('message', message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected');
      };

      this.ws.onerror = (error: Event) => {
        this.emit('error', error);
        reject(error);
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  async sendMessage(messageData: Partial<Message>): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected');
    }

    const message = createMessage(
      messageData.type || MessageType.DATA,
      messageData.payload || {},
      this.clientId,
      messageData.recipient
    );

    this.ws.send(JSON.stringify(message));
  }

  onMessage(callback: (message: Message) => void): void {
    this.eventHandlers.set('message', [callback]);
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.eventHandlers.set('connected', [() => callback(true)]);
    this.eventHandlers.set('disconnected', [() => callback(false)]);
  }
}
```

### Server WebSocket Implementation
```typescript
// File: /server/src/communication/WebSocketServer.ts
import WebSocket from 'ws';
import { IncomingMessage } from 'http';

export class WebSocketServer extends CommunicationServer {
  private wss: WebSocket.Server | null = null;

  async start(): Promise<void> {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const client: ClientInfo = {
        id: this.generateClientId(),
        connection: ws,
        ip: request.socket.remoteAddress,
        connectedAt: new Date()
      };

      this.clients.add(client);
      this.emit('clientConnected', client);

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: Message = JSON.parse(data.toString());
          this.emit('message', message, client);
        } catch (error) {
          this.sendError(client, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.clients.delete(client);
        this.emit('clientDisconnected', client);
      });
    });

    console.log(`WebSocket server started on port ${this.port}`);
  }

  async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  async broadcastMessage(messageData: Partial<Message>): Promise<void> {
    const message = createMessage(
      messageData.type || MessageType.DATA,
      messageData.payload || {},
      'server',
      'all'
    );

    this.clients.forEach(client => {
      if (client.connection.readyState === WebSocket.OPEN) {
        client.connection.send(JSON.stringify(message));
      }
    });
  }

  async sendToClient(clientId: string, messageData: Partial<Message>): Promise<void> {
    const client = Array.from(this.clients).find(c => c.id === clientId);
    if (!client || client.connection.readyState !== WebSocket.OPEN) {
      throw new Error(`Client ${clientId} not found or not connected`);
    }

    const message = createMessage(
      messageData.type || MessageType.DATA,
      messageData.payload || {},
      'server',
      clientId
    );

    client.connection.send(JSON.stringify(message));
  }

  onClientConnect(callback: (client: ClientInfo) => void): void {
    this.messageHandlers.set('clientConnected', [callback]);
  }

  onClientDisconnect(callback: (client: ClientInfo) => void): void {
    this.messageHandlers.set('clientDisconnected', [callback]);
  }

  onMessage(callback: (message: Message, client: ClientInfo) => void): void {
    this.messageHandlers.set('message', [callback]);
  }

  private sendError(client: ClientInfo, errorMessage: string): void {
    const errorMsg = createMessage(
      MessageType.ERROR,
      { error: errorMessage },
      'server',
      client.id
    );

    if (client.connection.readyState === WebSocket.OPEN) {
      client.connection.send(JSON.stringify(errorMsg));
    }
  }
}
```

## Protocol Migration Strategy

### Simple Factory Pattern
```typescript
// File: /shared/CommunicationFactory.ts
import { WebSocketManager } from '../client/src/communication/WebSocketManager';
import { WebSocketServer } from '../server/src/communication/WebSocketServer';

export class CommunicationFactory {
  static createManager(config: CommunicationConfig): CommunicationManager {
    switch(config.type) {
      case 'websocket':
        return new WebSocketManager(config);
      case 'webrtc':
        throw new Error('WebRTC not implemented yet'); // Future implementation
      default:
        throw new Error(`Unsupported communication type: ${config.type}`);
    }
  }

  static createServer(config: ServerConfig): CommunicationServer {
    switch(config.protocol) {
      case 'websocket':
        return new WebSocketServer(config);
      case 'webrtc':
        throw new Error('WebRTC server not implemented yet'); // Future implementation
      default:
        throw new Error(`Unsupported server type: ${config.protocol}`);
    }
  }
}
```

### Simple Configuration
```typescript
// File: /shared/config.ts
export const DEFAULT_CONFIG = {
  websocket: {
    serverUrl: 'ws://localhost:8080',
    port: 8080,
    reconnectInterval: 5000,
    maxReconnectAttempts: 3 // Keep simple
  },
  webrtc: {
    // Future - keep minimal for now
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
} as const;

export function createClientConfig(): CommunicationConfig {
  return {
    type: 'websocket',
    serverUrl: DEFAULT_CONFIG.websocket.serverUrl,
    reconnectInterval: DEFAULT_CONFIG.websocket.reconnectInterval,
    maxReconnectAttempts: DEFAULT_CONFIG.websocket.maxReconnectAttempts
  };
}

export function createServerConfig(): ServerConfig {
  return {
    protocol: 'websocket',
    port: DEFAULT_CONFIG.websocket.port
  };
}
```

## Simple Application Examples

### Minimal Client Features (Start Here)
- Connect to server
- Send simple text messages
- Receive and display responses
- Show connection status (connected/disconnected)
- Basic error handling

### Minimal Server Features (Start Here)
- Accept client connections
- Echo received messages back to sender
- Log basic events (connect/disconnect)
- Handle client disconnections

### Future Enhancements (After Basic Works)
- Reconnection logic
- Heartbeat messages
- Broadcast to multiple clients
- Message validation

## Simple Testing Strategy
- Manual testing first (connect, send, receive)
- Basic unit tests for message creation
- Simple integration test (client connects, sends message, receives response)
- Test disconnection handling

## WebRTC Migration (Future)
When basic WebSocket works, convert by:

1. **Create WebRTCManager class** extending CommunicationManager
2. **Replace WebSocket with RTCPeerConnection**
3. **Use data channels** for messaging
4. **Same message format** - no application logic changes needed

## Simple Quality Gates
- TypeScript compiles without errors
- All communication goes through abstraction layer
- Basic test: client connects, sends message, receives response
- No direct WebSocket API calls in application logic

## Minimal File Structure
```
/client/
  /src/
    /communication/
      - CommunicationManager.ts (abstract base)
      - WebSocketManager.ts (WebSocket implementation)
    /app/
      - main.ts (simple application logic)
    - index.html

/server/
  /src/
    /communication/
      - CommunicationServer.ts (abstract base)
      - WebSocketServer.ts (WebSocket implementation)
    - server.ts (main server file)
  - package.json
  - tsconfig.json

/shared/
  - CommunicationFactory.ts
  - types.ts
  - config.ts

/tests/
  - basic.test.ts (simple connection test)
```

## Implementation Priority
1. **Start minimal** - basic WebSocket connection working
2. **Add TypeScript** - strict typing for all interfaces
3. **Test thoroughly** - manual testing before automation
4. **Abstract properly** - prepare for WebRTC without over-engineering
5. **Keep it simple** - add complexity only when needed