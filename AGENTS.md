# AI Call Center Agents

This document describes the AI agents and tools used in this call center application.

## Overview

This project implements an AI-powered call center using OpenAI's Realtime API with a browser-based chat interface. The system uses a RealtimeAgent that can interact with users in real-time through text-based conversations, and execute various tools to assist users. The architecture supports multiple transport modes, with browser chat currently implemented and Twilio voice integration planned for future releases.

## Main Agent

### Greeter Agent

**Name:** `Greeter`

**Type:** `RealtimeAgent`

**Description:** A friendly assistant that handles browser chat conversations and can access various information sources and tools.

**Instructions:**
```
You are a friendly assistant. When you use a tool always first say what you are about to do.
```

**Configuration:**
- **Model:** `gpt-realtime`
- **Voice:** `verse` (for future audio support)
- **Transport:** Browser Chat WebSocket (via BrowserChatTransportLayer)
- **Modalities:** `['text']` (text-only mode for browser chat)

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

### Browser Chat Integration

The agent integrates with a web-based chat interface for text-based conversations:

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

### Session Management

Each browser connection creates a new `RealtimeSession` with:
- The Greeter agent
- Browser chat transport layer for text messaging
- Text-only modality configuration  
- Event listeners for tool approvals and MCP tool changes
- WebSocket connection management and cleanup
- Session isolation (each browser tab gets independent session)

## Environment Variables

Required environment variables:

- `OPENAI_API_KEY`: OpenAI API key with Realtime API access
- `PORT` (optional): Server port (defaults to 5050)
- `TRANSPORT_MODE` (optional): Transport mode selection
  - `browser-chat`: Enable browser chat interface (default)
  - `twilio`: Enable Twilio voice integration (planned)
  - `both`: Enable all transport modes (planned)

## Usage

### Browser Chat Interface

When a user opens the chat interface:
1. User navigates to `/chat` in their web browser
2. A WebSocket connection is established to `/chat-stream`
3. The Greeter agent initiates text-based conversation
4. Users can type messages asking about:
   - Weather information: "What's the weather in London?"
   - D&D information: "Tell me about dungeons and dragons"
   - Wikipedia content: "Search for artificial intelligence"
   - The special number: "What is the special number?"
5. The agent announces tool usage before executing
6. Responses appear in real-time in the chat interface

### Example Conversation Flow
```
User: What's the weather like in New York?
Agent: I'm going to check the weather for New York.
[Agent uses weather tool]
Agent: The current weather in New York is...
```

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

The browser chat implementation uses `BrowserChatSessionService`:

- **Connection Management**: Handles WebSocket lifecycle
- **Message Transformation**: Converts browser messages to OpenAI format
- **Session Isolation**: Each browser tab gets independent session
- **Error Handling**: Graceful connection cleanup and error recovery
- **Event Handling**: Tool approvals and MCP tool updates

### Clean Architecture Benefits

- **Domain Independence**: Agent logic is transport-agnostic
- **Easy Testing**: Text mode enables faster development cycles
- **Extensibility**: Adding new transport modes requires minimal changes
- **Maintainability**: Clear separation of concerns across layers

## Transport Modes

The system is designed to support multiple transport modes:

### Current Implementation
- **Browser Chat**: Fully implemented text-based chat interface
  - Real-time WebSocket messaging
  - Modern web UI with connection status
  - Mobile and desktop responsive design
  - Session isolation per browser tab

### Planned Features
- **Twilio Voice**: Phone call integration (future)
  - Voice-based conversations
  - Audio streaming with OpenAI Realtime API
  - Traditional telephony interface

- **Multiple Modes**: Support for running both simultaneously
  - Same agent logic serves all transport types
  - Independent session management
  - Unified tool access across modes

## Notes

- The agent always announces what it's about to do before using a tool
- Tool approvals are handled automatically in the session service
- MCP tools provide dynamic capabilities that can be updated at runtime
- The system uses background results for certain tools to improve responsiveness
- Each browser connection creates an isolated session with the same agent
- The agent works identically across transport modes - only the I/O format changes
- Text mode enables faster testing and development compared to audio-based interfaces
