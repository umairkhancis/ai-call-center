# Browser Chat Interface Implementation

## Overview

This document outlines the requirements for implementing a browser-based chat interface as an alternative to the Twilio voice interface. This addition will enable the system to support multiple input/output mechanisms while maintaining the same domain logic, following the clean architecture principles defined in [ARCHIECTURE.md](./ARCHIECTURE.md).

## Objectives

1. **Add Browser Chat Transport Layer**: Implement a WebSocket-based chat interface that connects browsers directly to the AI agent
2. **Maintain Architecture Integrity**: Follow clean architecture with proper layer separation
3. **Enable Dynamic Switching**: Provide configuration-based toggle between Twilio and Browser Chat interfaces
4. **Reuse Domain Logic**: Both transport layers should access the same agent domain logic without duplication

## Current State

### Existing Implementation
- **Transport Layer**: Twilio Voice (via `TwilioRealtimeTransportLayer`)
- **Endpoints**: 
  - `/incoming-call` - HTTP endpoint for Twilio webhooks
  - `/media-stream` - WebSocket endpoint for Twilio audio streams
- **Domain Layer**: `RealtimeAgent` with tools (weather, secret, MCP tools)

### Available Resources
- **chat.js**: ChatUI class providing browser-based chat interface with:
  - Message display and management
  - User input handling
  - Auto-scrolling
  - Microphone muting coordination
- **index.html**: HTML structure for chat interface
- **style.css**: Styling for chat UI (referenced but not yet implemented)

## Requirements

### 1. Browser Chat Transport Layer

#### Transport Implementation
Create a new transport layer class similar to `TwilioRealtimeTransportLayer`:

**Location**: `src/application/transport/browser-chat.transport.ts`

**Responsibilities**:
- Accept WebSocket connections from browsers
- Transform browser chat messages to OpenAI Realtime API format
- Transform OpenAI Realtime API responses to browser-compatible format
- Handle connection lifecycle (connect, disconnect, error)
- Manage message queuing and delivery

**Interface Compatibility**:
- Must be compatible with `RealtimeSession`
- Should implement same transport interface as Twilio layer
- Enable seamless swapping without domain logic changes

#### New Endpoints

**WebSocket Endpoint**: `/chat-stream`
- Accept WebSocket connections from browser clients
- Create RealtimeSession with BrowserChatTransportLayer
- Handle text-based messages (not audio)
- Return AI responses as text

**HTTP Endpoint**: `/chat` (optional)
- Serve the HTML/JS chat interface
- Enable standalone browser access without separate hosting

### 2. Frontend Integration

#### Enhance chat.js
- Add WebSocket connection logic
- Implement message serialization/deserialization
- Handle connection states (connecting, connected, disconnected, error)
- Display AI responses in real-time
- Handle typing indicators (optional)
- Support streaming responses (optional)
- Make sure to write chat.js code in typescript.

#### Enhance index.html
- Add connection status indicator
- Include necessary scripts for WebSocket communication
- Add error handling UI
- Provide connection configuration (server URL)

#### Create style.css
- Style chat interface professionally
- Ensure responsive design
- Differentiate user vs AI messages
- Style connection status indicators

### 3. Configuration Toggle

#### Environment Configuration
**Location**: `src/config/environment.ts`

Add new configuration options:
```typescript
interface EnvironmentConfig {
  openaiApiKey: string;
  port: number;
  transportMode: 'twilio' | 'browser-chat' | 'both'; // New field
  enableTwilio: boolean;  // Derived from transportMode
  enableBrowserChat: boolean;  // Derived from transportMode
}
```

**Environment Variables**:
- `TRANSPORT_MODE`: Set to 'twilio', 'browser-chat', or 'both'
- Default: 'both' (enable all interfaces)

#### Conditional Route Registration
**Location**: `src/index.ts`

Modify bootstrap function to conditionally register routes:
```typescript
if (config.enableTwilio) {
  registerTwilioRoutes(server.getInstance(), twilioController);
}

if (config.enableBrowserChat) {
  registerChatRoutes(server.getInstance(), chatController);
}
```

### 4. Clean Architecture Compliance

#### Layer Structure
```
src/
├── config/
│   └── environment.ts           # Add transportMode config
│
├── domain/                      # No changes needed
│   ├── agents/
│   └── tools/
│
├── application/
│   ├── services/
│   │   └── session.service.ts   # Reused by both transports
│   ├── transport/               # New directory
│   │   ├── browser-chat.transport.ts
│   │   └── twilio.transport.ts (future: extract if needed)
│   └── server.ts
│
└── presentation/
    ├── controllers/
    │   ├── call.controller.ts   # Twilio-specific
    │   └── chat.controller.ts   # New: Browser chat controller
    ├── routes/
    │   ├── call.routes.ts       # Twilio routes
    │   └── chat.routes.ts       # New: Browser chat routes
    └── public/                  # New: Static files
        ├── index.html
        ├── chat.js
        └── style.css
```

#### Dependency Flow
- **Domain Layer**: Independent, no knowledge of transport mechanisms
- **Application Layer**: Knows about transport abstractions, not implementations
- **Presentation Layer**: Depends on application and domain, handles specific protocols

### 5. Implementation Steps

1. **Create Browser Chat Transport Layer**
   - Implement `BrowserChatTransportLayer` class
   - Handle WebSocket protocol for browser clients
   - Transform messages between browser format and OpenAI format

2. **Create Chat Controller and Routes**
   - Implement `ChatController` similar to `CallController`
   - Create `/chat-stream` WebSocket endpoint
   - Create `/chat` HTTP endpoint to serve static files

3. **Update Configuration**
   - Add `transportMode` to environment config
   - Implement toggle logic in bootstrap function

4. **Enhance Frontend**
   - Update chat.js with WebSocket connectivity
   - Create style.css for professional UI
   - Update index.html with connection logic

5. **Update Session Service** (if needed)
   - Ensure `SessionService` works with both transport types
   - Abstract any transport-specific logic

6. **Update Documentation**
   - Update README.md with browser chat instructions
   - Update ARCHIECTURE.md with transport layer details
   - Update AGENTS.md if needed

7. **Testing**
   - Test Twilio mode independently
   - Test browser chat mode independently
   - Test 'both' mode with concurrent connections
   - Verify domain logic consistency across transports

## Expected Outcomes

### Functionality
- ✅ Users can interact with AI agent via browser chat
- ✅ Users can interact with AI agent via Twilio phone calls
- ✅ Configuration toggle works seamlessly
- ✅ Same agent logic serves both interfaces
- ✅ Both interfaces have access to all tools (weather, secret, MCP tools)

### Architecture
- ✅ Clean separation between transport layers
- ✅ Domain layer remains transport-agnostic
- ✅ Easy to add additional transport layers in future (SMS, Slack, etc.)
- ✅ SOLID principles maintained
- ✅ DRY principle - no duplicated agent logic

### User Experience
- ✅ Professional, modern chat interface
- ✅ Real-time responses
- ✅ Clear connection status
- ✅ Graceful error handling
- ✅ Responsive design for mobile and desktop

## Technical Considerations

### Message Format Differences
- **Twilio**: Audio streams (PCM audio data)
- **Browser Chat**: Text messages (JSON strings)
- Both must be transformed to OpenAI Realtime API format

### Session Management
- Each connection (Twilio or Browser) creates independent session
- Sessions should not interfere with each other
- Consider session cleanup on disconnect

### Error Handling
- Transport layer failures should not crash the server
- Graceful degradation for connection issues
- User-friendly error messages

### Security
- Consider authentication for browser chat endpoint
- Rate limiting for public endpoints
- Input validation and sanitization
- CORS configuration for browser access

## Future Enhancements

- Audio support in browser (voice chat)
- Message history and persistence
- Multi-user chat rooms
- User authentication and profiles
- Message encryption
- File sharing capabilities
- Emoji and rich text support
- Push notifications

## References

- [ARCHIECTURE.md](./ARCHIECTURE.md) - Clean architecture principles
- [AGENTS.md](./AGENTS.md) - Agent and tool documentation
- [README.md](./README.md) - Project overview
- [chat.js](./chat.js) - Existing ChatUI class implementation
- [index.html](./index.html) - Chat interface HTML structure
