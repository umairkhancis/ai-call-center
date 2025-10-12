# AI Call Center Architecture

## Overview

This application implements an AI-powered call center using OpenAI's Realtime API integrated with Twilio for voice communication. The system follows clean architecture principles with clear separation of concerns and layered dependencies.

## Architecture Layers

The application follows a clean architecture pattern with three distinct layers:

### 1. Presentation Layer (Outer Layer)
**Technologies:** Twilio Voice API, WebSocket, TwiML

**Responsibilities:**
- Handle incoming call requests via Twilio
- Establish WebSocket connections for real-time audio streaming
- Manage Twilio-specific protocols and responses
- Future support: Browser-based chat interface

**Components:**
- `/incoming-call` endpoint: Receives Twilio webhook and returns TwiML response
- `/media-stream` WebSocket endpoint: Handles bidirectional audio streaming

### 2. Application Layer (Middle Layer)
**Technologies:** Fastify, WebSocket Server, Transport Layer

**Responsibilities:**
- HTTP server management and routing
- WebSocket connection lifecycle management
- Session orchestration and state management
- Transport layer abstraction between communication protocols and AI agents

**Components:**
- Fastify web server with WebSocket support
- `TwilioRealtimeTransportLayer`: Adapter for Twilio audio streams
- Session management for concurrent calls
- Tool approval workflow handling

### 3. Domain Layer (Inner Layer)
**Technologies:** OpenAI Realtime API, Custom Tools

**Responsibilities:**
- AI agent definition and behavior
- Tool definitions and execution logic
- Business logic for call handling
- Integration with external knowledge sources (MCP tools)

**Components:**
- `RealtimeAgent`: Core AI agent with instructions and capabilities
- Custom tools: `weatherTool`, `secretTool`
- Hosted MCP tools: `dnd` (D&D information), `deepwiki` (Wikipedia)
- `RealtimeSession`: Manages conversation state and tool execution

## Data Flow

```
Incoming Call
    ↓
Twilio → /incoming-call (HTTP)
    ↓
TwiML Response with WebSocket URL
    ↓
Twilio → /media-stream (WebSocket)
    ↓
TwilioRealtimeTransportLayer
    ↓
RealtimeSession
    ↓
RealtimeAgent + OpenAI Realtime API
    ↓
Tool Execution (if needed)
    ↓
Audio Response → Twilio → Caller
```

## Architecture Principles

### Clean Architecture
- **Inner layers are independent:** Domain layer has no knowledge of Fastify or Twilio
- **Outer layers depend on inner layers:** Presentation layer uses Application layer, which uses Domain layer
- **Dependency inversion:** Transport layers implement interfaces, allowing flexibility in communication protocols

### SOLID Principles
- **Single Responsibility:** Each component has one well-defined purpose
- **Open/Closed:** System is open for extension (new tools, new transport layers) but closed for modification
- **Liskov Substitution:** Transport layers can be substituted (Twilio, Browser, etc.)
- **Interface Segregation:** Clean interfaces between layers
- **Dependency Inversion:** High-level agent logic doesn't depend on low-level transport details

### DRY (Don't Repeat Yourself)
- Reusable tool definitions
- Shared agent configuration
- Common session management patterns

### YAGNI (You Aren't Gonna Need It)
- Implement features only when required
- Start with Twilio integration; browser chat can be added later
- Keep tool set minimal and expand as needed

## Technology Stack

**Runtime:** Node.js with TypeScript
**Web Framework:** Fastify
**AI Platform:** OpenAI Realtime API
**Telephony:** Twilio Voice API
**Protocol:** WebSocket for real-time communication
**Schema Validation:** Zod
**Package Management:** npm

## Scalability Considerations

- **Stateless design:** Each call creates an independent session
- **WebSocket per call:** Isolated connections prevent cross-talk
- **Async operations:** Non-blocking I/O for concurrent call handling
- **Environment-based configuration:** Easy deployment across environments

## Future Extensions

- Browser-based chat interface (alternative to Twilio)
- Additional transport layers for other communication platforms
- Enhanced tool ecosystem with more MCP integrations
- Call recording and analytics
- Multi-agent routing based on caller needs
