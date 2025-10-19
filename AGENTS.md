# AI Call Center Agents

This document describes the AI agents and tools used in this call center application.

## Overview

This project implements an AI-powered call center using OpenAI's Realtime API with support for multiple communication channels. The system uses a RealtimeAgent that can interact with users in real-time through both text-based conversations (browser chat) and voice conversations (Twilio phone calls), executing various tools to assist users. The architecture supports configurable transport modes that can be enabled independently or simultaneously.

## Main Agent

### Greeter Agent

**Name:** `Greeter`

**Type:** `RealtimeAgent`

**Description:** A friendly assistant that handles both browser chat conversations and phone calls, with access to various information sources and tools.

**Instructions:**
```
You are a friendly assistant. When you use a tool always first say what you are about to do.
```

**Configuration:**
- **Model:** `gpt-realtime`
- **Voice:** `verse` (for Twilio voice calls)
- **Transport:** Configurable transport layers:
  - Browser Chat: `BrowserChatTransportLayer` with `['text']` modalities
  - Twilio Voice: `TwilioRealtimeTransportLayer` with `['audio']` modalities
- **Session Management:** Independent sessions per connection type

## Available Tools

The Greeter agent has access to the following tools:

### 1. MCP Hosted Tools

#### DnD Tool
- **Server Label:** `dnd`
- **Purpose:** Provides access to Dungeons & Dragons information and resources
- **Type:** Hosted MCP (Model Context Protocol) tool

#### DeepWiki Tool
- **Server Label:** `deepwiki`
- **Purpose:** Provides deep access to Wikipedia content and knowledge
- **Type:** Hosted MCP (Model Context Protocol) tool

### 2. Custom Tools

#### Weather Tool
- **Name:** `weather`
- **Description:** Get the weather in a given location
- **Parameters:**
  - `location` (string): The location to check weather for
- **Execution:** Returns background result with weather information
- **Approval Required:** No

#### Secret Tool
- **Name:** `secret`
- **Description:** A secret tool to tell the special number
- **Parameters:**
  - `question` (string): The question to ask the secret tool; mainly about the special number
- **Execution:** Returns answer to questions (always returns 42)
- **Approval Required:** Yes

## Agent Behavior

### Tool Approval

The agent is configured to automatically approve tool calls that require approval (like the `secretTool`). When a tool approval is requested:

```typescript
session.on('tool_approval_requested', (context, agent, approvalRequest) => {
  console.log(`Approving tool call for ${approvalRequest.approvalItem.rawItem.name}.`);
  session.approve(approvalRequest.approvalItem);
});
```

### MCP Tools

The agent listens for MCP tool changes and logs available tools:

```typescript
session.on('mcp_tools_changed', (tools) => {
  const toolNames = tools.map((tool) => tool.name).join(', ');
  console.log(`Available MCP tools: ${toolNames || 'None'}`);
});
```

## Integration

The agent supports dual integration modes that can be enabled independently or simultaneously:

### Browser Chat Integration

Web-based chat interface for text-based conversations:

1. **Chat Interface Endpoint:** `/chat`
   - Serves the HTML chat interface
   - Provides real-time messaging UI with connection status
   - Responsive design for desktop and mobile browsers

2. **Chat Stream Endpoint:** `/chat-stream`
   - WebSocket endpoint for real-time text messaging
   - Creates a new session for each browser connection
   - Connects to OpenAI Realtime API in text mode

3. **Chat Status Endpoint:** `/chat-status`
   - Returns service health and active session count
   - Provides connection diagnostics

### Twilio Voice Integration

Traditional phone call interface for voice-based conversations:

1. **Health Check Endpoint:** `/`
   - Returns service status: "Twilio Media Stream Server is running!"
   - General health monitoring

2. **Incoming Call Endpoint:** `/incoming-call`
   - Twilio webhook endpoint for incoming calls
   - Returns TwiML response to establish WebSocket connection
   - Plays initial greeting: "O.K. you can start talking!"

3. **Media Stream Endpoint:** `/media-stream`
   - WebSocket endpoint for real-time audio streaming
   - Creates a new session for each call
   - Connects to OpenAI Realtime API in audio mode

### Session Management

The system creates independent `RealtimeSession` instances for each connection type:

#### Browser Chat Sessions
- **Service:** `BrowserChatSessionService`
- **Transport:** `BrowserChatTransportLayer`
- **Modalities:** `['text']` for text-only communication
- **Session Isolation:** Each browser tab gets independent session
- **Connection Management:** WebSocket lifecycle handling

#### Twilio Voice Sessions
- **Service:** `CallChatSessionService`
- **Transport:** `TwilioRealtimeTransportLayer`
- **Modalities:** `['audio']` for voice communication
- **Voice Configuration:** Uses 'verse' voice model
- **Audio Handling:** Real-time audio stream processing

#### Common Session Features
- The same Greeter agent serves both transport types
- Automatic tool approval handling
- MCP tool change event listeners
- Error handling and connection cleanup
- Session status monitoring

## Environment Variables

Required environment variables:

- `OPENAI_API_KEY`: OpenAI API key with Realtime API access
- `PORT` (optional): Server port (defaults to 5050)
- `TRANSPORT_MODE` (optional): Transport mode selection
  - `browser-chat`: Enable browser chat interface only
  - `twilio`: Enable Twilio voice integration only
  - `both`: Enable all transport modes simultaneously (default)

## Usage

The agent can be accessed through two different interfaces:

### Browser Chat Interface

For text-based conversations:
1. User navigates to `/chat` in their web browser
2. A WebSocket connection is established to `/chat-stream`
3. The Greeter agent initiates text-based conversation
4. Users can type messages asking about various topics
5. The agent announces tool usage before executing
6. Responses appear in real-time in the chat interface

### Twilio Voice Interface

For voice-based conversations:
1. User calls the configured Twilio phone number
2. Twilio routes the call to `/incoming-call`
3. A WebSocket connection is established to `/media-stream`
4. The Greeter agent plays greeting and initiates voice conversation
5. Users can speak naturally about various topics
6. The agent announces tool usage before executing
7. Responses are spoken back through text-to-speech

### Common Example Queries

Both interfaces support the same functionality:
- Weather information: "What's the weather in London?"
- D&D information: "Tell me about dungeons and dragons"
- Wikipedia content: "Search for artificial intelligence"
- The special number: "What is the special number?"

### Example Conversation Flow
```
User: What's the weather like in New York?
Agent: I'm going to check the weather for New York.
[Agent uses weather tool]
Agent: The current weather in New York is...
```
*Note: This flow works identically in both text (browser) and voice (Twilio) modes.*

## Technical Implementation

### Agent Architecture

The Greeter agent is implemented using OpenAI's `@openai/agents` library:

```typescript
// src/domain/agents/greeter.agent.ts
export const greeterAgent = new RealtimeAgent({
  name: 'Greeter',
  instructions: 'You are a friendly assistant. When you use a tool always first say what you are about to do.',
  tools: [
    { type: 'hosted_tool', name: 'dnd' },      // MCP D&D tool
    { type: 'hosted_tool', name: 'deepwiki' }, // MCP Wikipedia tool
    secretTool,                                 // Custom secret tool
    weatherTool,                               // Custom weather tool
  ],
});
```

### Session Service Integration

The system uses dedicated session services for each transport mode:

#### BrowserChatSessionService
- **Connection Management**: Handles WebSocket lifecycle for browser clients
- **Message Transformation**: Converts JSON messages to OpenAI format
- **Session Isolation**: Each browser tab gets independent session
- **Transport Layer**: Uses `BrowserChatTransportLayer`
- **Modalities**: Text-only communication

#### CallChatSessionService  
- **Connection Management**: Handles Twilio WebSocket lifecycle
- **Audio Processing**: Converts audio streams to OpenAI format
- **Session Isolation**: Each phone call gets independent session
- **Transport Layer**: Uses `TwilioRealtimeTransportLayer`
- **Modalities**: Audio-only communication

#### Common Service Features
- **Error Handling**: Graceful connection cleanup and error recovery
- **Event Handling**: Tool approvals and MCP tool updates
- **Session Monitoring**: Active session tracking and management

### Clean Architecture Benefits

- **Domain Independence**: Agent logic is transport-agnostic
- **Easy Testing**: Text mode enables faster development cycles
- **Extensibility**: Adding new transport modes requires minimal changes
- **Maintainability**: Clear separation of concerns across layers

## Transport Modes

The system supports multiple transport modes that can be configured independently:

### Fully Implemented Transport Modes

#### Browser Chat
- **Status**: ✅ Fully implemented and production-ready
- **Features**: 
  - Real-time WebSocket messaging
  - Modern web UI with connection status
  - Mobile and desktop responsive design
  - Session isolation per browser tab
  - JSON message protocol

#### Twilio Voice
- **Status**: ✅ Fully implemented and production-ready
- **Features**:
  - Voice-based conversations
  - Real-time audio streaming with OpenAI Realtime API
  - Traditional telephony interface
  - Automatic call routing and session management
  - Base64-encoded PCM audio protocol

#### Multiple Modes
- **Status**: ✅ Fully implemented
- **Features**:
  - Both transports can run simultaneously
  - Same agent logic serves all transport types
  - Independent session management per connection
  - Unified tool access across all modes
  - Environment-based configuration

## Notes

- The agent always announces what it's about to do before using a tool
- Tool approvals are handled automatically in both session services
- MCP tools provide dynamic capabilities that can be updated at runtime
- The system uses background results for certain tools to improve responsiveness
- Each connection (browser or phone) creates an isolated session with the same agent
- The agent works identically across transport modes - only the I/O format changes (text vs audio)
- Browser chat enables faster testing and development compared to phone-based testing
- Both transport modes share the same domain logic and tools
- Sessions are completely independent between transport types
- Configuration allows running one or both modes simultaneously
