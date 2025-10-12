# AI Call Center Agents

This document describes the AI agents and tools used in this call center application.

## Overview

This project implements an AI-powered call center using OpenAI's Realtime API integrated with Twilio for phone call handling. The system uses a RealtimeAgent that can interact with callers in real-time, process audio streams, and execute various tools to assist users.

## Main Agent

### Greeter Agent

**Name:** `Greeter`

**Type:** `RealtimeAgent`

**Description:** A friendly assistant that handles incoming phone calls and can access various information sources and tools.

**Instructions:**
```
You are a friendly assistant. When you use a tool always first say what you are about to do.
```

**Configuration:**
- **Model:** `gpt-realtime`
- **Voice:** `verse`
- **Transport:** Twilio WebSocket (via TwilioRealtimeTransportLayer)

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

### Twilio Integration

The agent integrates with Twilio for phone call handling:

1. **Incoming Call Endpoint:** `/incoming-call`
   - Returns TwiML response to establish WebSocket connection
   - Plays initial greeting: "O.K. you can start talking!"

2. **Media Stream Endpoint:** `/media-stream`
   - WebSocket endpoint for real-time audio streaming
   - Creates a new session for each call
   - Connects to OpenAI Realtime API

### Session Management

Each incoming call creates a new `RealtimeSession` with:
- The Greeter agent
- Twilio transport layer for audio streaming
- Audio output configuration
- Event listeners for tool approvals and MCP tool changes

## Environment Variables

Required environment variables:

- `OPENAI_API_KEY`: OpenAI API key with Realtime API access
- `PORT` (optional): Server port (defaults to 5050)

## Usage

When a call comes in:
1. Twilio routes the call to `/incoming-call`
2. A WebSocket connection is established to `/media-stream`
3. The Greeter agent initiates conversation
4. Users can ask about weather, DnD information, Wikipedia content, or the special number
5. The agent announces tool usage before executing

## Notes

- The agent always announces what it's about to do before using a tool
- Tool approvals are handled automatically
- MCP tools provide dynamic capabilities that can be updated at runtime
- The system uses background results for certain tools to improve responsiveness
