# Using OpenAI Realtime Agent in Text Mode

This document explains how the AI Call Center uses the OpenAI Realtime Agent with text modality instead of audio.

## Overview

The Realtime API supports both audio and text modalities. For the browser chat interface, we configure the agent to use **text-only mode**, which allows the agent to:

- Process text messages
- Access all tools (weather, secret, DnD, DeepWiki)
- Generate text responses
- Execute the same agent logic as the audio mode

## Architecture

### 1. Transport Layer Pattern

The implementation follows the same pattern as Twilio audio streaming, but adapted for text:

```
Browser WebSocket → BrowserChatTransportLayer → RealtimeSession → OpenAI API
                                                       ↓
Browser              ←  BrowserChatTransportLayer  ←  Responses
```

### 2. Key Components

#### BrowserChatTransportLayer

Located in: `src/application/transport/browser-chat.transport.ts`

**Responsibilities:**
- Listens to browser WebSocket messages
- Transforms browser messages to OpenAI Realtime API format
- Emits events that the RealtimeSession processes
- Receives responses from OpenAI and sends them back to browser

**Message Transformation:**

When a user sends a message, the transport layer:

```typescript
// Browser sends:
{ type: 'message', content: 'What is the weather in London?' }

// Transport emits to session:
{
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [{ type: 'input_text', text: 'What is the weather in London?' }]
  }
}

// Then triggers:
{ type: 'response.create' }
```

#### ChatController

Located in: `src/presentation/controllers/chat.controller.ts`

**Responsibilities:**
- Creates a RealtimeSession for each browser connection
- Connects the session to OpenAI API
- Manages session lifecycle
- Tracks active sessions

**Key Method:**

```typescript
async handleChatStream(connection: WebSocket) {
  // 1. Create session with BrowserChatTransportLayer
  const session = this.sessionService.createBrowserChatSession(
    this.agent,
    connection,
    { apiKey: this.apiKey, model: 'gpt-realtime' }
  );

  // 2. Connect to OpenAI
  await this.sessionService.connectSession(session, this.apiKey);

  // 3. Transport handles everything automatically
  // No manual message processing needed!
}
```

#### SessionService

Located in: `src/application/services/session.service.ts`

**Configuration for Text Mode:**

```typescript
createBrowserChatSession(agent, browserWebSocket, config) {
  const session = new RealtimeSession(agent, {
    transport: new BrowserChatTransportLayer({ browserWebSocket }),
    model: 'gpt-realtime',
    config: {
      modalities: ['text'],        // TEXT ONLY - no audio
      turn_detection: null,        // No voice activity detection
    },
  });
  return session;
}
```

## How It Works

### Message Flow

1. **User sends message** via browser WebSocket:
   ```json
   { "type": "message", "content": "What is the weather in London?" }
   ```

2. **BrowserChatTransportLayer receives it** and transforms to OpenAI format:
   - Emits `conversation.item.create` event
   - Emits `response.create` event

3. **RealtimeSession** (the OpenAI SDK):
   - Receives events from transport layer
   - Sends them to OpenAI Realtime API
   - Agent processes the message
   - Agent may call tools (weather, secret, etc.)
   - Generates response

4. **OpenAI sends response back**:
   - Response events come back through the session
   - Session calls `transport.send()` with response data

5. **BrowserChatTransportLayer transforms response** and sends to browser:
   ```json
   { "type": "assistant.message", "text": "The weather in London is sunny." }
   { "type": "response.done" }
   ```

## Key Differences from Audio Mode

| Feature | Audio Mode (Twilio) | Text Mode (Browser) |
|---------|-------------------|-------------------|
| Transport | TwilioRealtimeTransportLayer | BrowserChatTransportLayer |
| Modalities | `['audio']` or `['audio', 'text']` | `['text']` |
| Turn Detection | Voice activity detection | `null` (not needed) |
| Input Format | Audio stream (base64) | Text messages (JSON) |
| Output Format | Audio stream (base64) | Text messages (JSON) |
| Agent Tools | ✅ Same tools available | ✅ Same tools available |
| Agent Logic | ✅ Same agent | ✅ Same agent |

## Agent Integration

Both modes use the **same agent** (`greeterAgent`):

```typescript
// src/domain/agents/greeter.agent.ts
export const greeterAgent = new RealtimeAgent({
  name: 'Greeter',
  instructions: 'You are a friendly assistant...',
  tools: [
    { type: 'hosted_tool', name: 'dnd' },
    { type: 'hosted_tool', name: 'deepwiki' },
    secretTool,
    weatherTool,
  ],
});
```

The agent works identically in both modes:
- Same instructions
- Same tool access
- Same behavior
- Only the I/O format changes (audio vs text)

## Benefits of This Approach

1. **Code Reuse**: Same agent, same tools, minimal code duplication
2. **Automatic Message Handling**: Transport layer handles all protocol details
3. **Tool Support**: Full access to all agent capabilities in text mode
4. **Scalability**: Each browser connection gets its own isolated session
5. **Simplicity**: Controller code is very simple - just create session and connect

## Testing

To test text mode:

1. Start the server:
   ```bash
   npm run dev
   ```

2. Open browser to: `http://localhost:5050/chat`

3. Send messages to test:
   - "What is the weather in London?"
   - "What is the special number?"
   - "Tell me about D&D"

The agent will process messages using the Realtime API in text mode!

## Event Types Reference

### Browser → Transport

- `{ type: 'message', content: string }` - User message
- `{ type: 'ping' }` - Connection keepalive

### Transport → OpenAI

- `conversation.item.create` - Add user message
- `response.create` - Request agent response

### OpenAI → Transport

- `conversation.item.created` - Message added to conversation
- `response.text.delta` - Streaming text chunk
- `response.text.done` - Complete text response
- `response.done` - Response generation complete
- `error` - Error occurred

### Transport → Browser

- `{ type: 'pong' }` - Keepalive response
- `{ type: 'assistant.message', text: string }` - Agent response
- `{ type: 'text.delta', delta: string }` - Streaming update
- `{ type: 'text.done', text: string }` - Complete response
- `{ type: 'response.done' }` - Response finished
- `{ type: 'error', error: string }` - Error message

## Summary

The implementation demonstrates that **the OpenAI Realtime Agent can work with both audio and text** by:

1. Configuring the session with `modalities: ['text']`
2. Using a transport layer that transforms text messages to/from the Realtime API format
3. Letting the agent handle all the logic (tools, instructions, etc.) the same way

No manual message processing or tool invocation is needed - the agent and session handle everything automatically!

