# Examples: Using Realtime Agent in Text Mode

## Example 1: Basic Setup (What We Built)

This is the pattern used in `chat.controller.ts`:

```typescript
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { SessionService } from './session.service';
import { BrowserChatTransportLayer } from './browser-chat.transport';

// Create agent with tools
const agent = new RealtimeAgent({
  name: 'Greeter',
  instructions: 'You are a friendly assistant.',
  tools: [weatherTool, secretTool]
});

// Create session with text modality
const transport = new BrowserChatTransportLayer({ browserWebSocket });
const session = new RealtimeSession(agent, {
  transport,
  model: 'gpt-realtime',
  config: {
    modalities: ['text'],     // TEXT MODE!
    turn_detection: null,     // No voice detection
  }
});

// Connect to OpenAI
await session.connect({ apiKey: process.env.OPENAI_API_KEY });

// That's it! The transport handles all message routing automatically
```

## Example 2: Alternative Approach (If You Want Manual Control)

If you wanted to manually send messages instead of using a transport layer:

```typescript
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

// Create agent
const agent = new RealtimeAgent({
  name: 'Assistant',
  instructions: 'You are helpful.',
  tools: [myTool]
});

// Create session without transport (direct connection)
const session = new RealtimeSession(agent, {
  model: 'gpt-realtime',
  config: {
    modalities: ['text']
  }
});

// Connect
await session.connect({ apiKey: API_KEY });

// Listen for responses
session.on('conversation.item.created', (event) => {
  if (event.item?.role === 'assistant') {
    const text = event.item.content?.[0]?.text;
    console.log('Agent said:', text);
  }
});

// Send a message manually
// Note: The exact API might vary based on SDK version
await session.sendEvent({
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [{ type: 'input_text', text: 'Hello!' }]
  }
});

await session.sendEvent({ type: 'response.create' });
```

## Example 3: Using in processMessage (Your Question)

If you wanted to use the agent directly in a `processMessage` function:

```typescript
class ChatController {
  private sessions: Map<string, RealtimeSession> = new Map();

  async processMessage(
    sessionId: string, 
    userMessage: string
  ): Promise<string> {
    // Get or create session for this user
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = new RealtimeSession(this.agent, {
        model: 'gpt-realtime',
        config: { modalities: ['text'] }
      });
      await session.connect({ apiKey: this.apiKey });
      this.sessions.set(sessionId, session);
    }

    // Create a promise to wait for the response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Response timeout'));
      }, 30000);

      // Listen for the response
      const handler = (event: any) => {
        if (event.item?.role === 'assistant') {
          const text = event.item.content?.[0]?.text;
          if (text) {
            clearTimeout(timeout);
            session.off('conversation.item.created', handler);
            resolve(text);
          }
        }
      };

      session.on('conversation.item.created', handler);

      // Send the message
      session.sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: userMessage }]
        }
      }).then(() => {
        return session.sendEvent({ type: 'response.create' });
      }).catch(reject);
    });
  }
}
```

## Example 4: Recommended Pattern (Transport Layer)

**This is what we implemented and is the cleanest approach:**

```typescript
// chat.controller.ts
async handleChatStream(connection: WebSocket): Promise<void> {
  // Create session with transport that handles everything
  const session = this.sessionService.createBrowserChatSession(
    this.agent,
    connection,
    { apiKey: this.apiKey, model: 'gpt-realtime' }
  );

  // Connect - transport handles all message routing automatically
  await this.sessionService.connectSession(session, this.apiKey);
  
  // Done! No manual message handling needed.
  // The transport layer:
  // 1. Receives messages from browser
  // 2. Transforms them to OpenAI format
  // 3. Sends them to the session
  // 4. Receives responses from OpenAI
  // 5. Sends them back to browser
}
```

## Comparison of Approaches

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Transport Layer** (Example 4) | Clean, automatic, handles streaming | More setup | Production, WebSocket apps |
| **Manual Events** (Example 2) | Full control, simple | Must handle all events yourself | Learning, debugging |
| **Promise Wrapper** (Example 3) | Simple async/await interface | Doesn't handle streaming well | REST APIs, simple chat |

## Configuration Options

### Text-Only Mode
```typescript
config: {
  modalities: ['text'],        // Only text, no audio
  turn_detection: null,        // No voice activity detection
}
```

### Text + Audio Mode
```typescript
config: {
  modalities: ['text', 'audio'],  // Both text and audio
  voice: 'alloy',                 // Voice for audio output
  turn_detection: {               // Voice activity detection
    type: 'server_vad',
    threshold: 0.5
  }
}
```

### Text with Streaming
```typescript
// Listen for streaming chunks
session.on('response.text.delta', (event) => {
  process.stdout.write(event.delta); // Stream text as it arrives
});

session.on('response.text.done', (event) => {
  console.log('\nComplete text:', event.text);
});
```

## Tool Execution

Tools work the same in text mode:

```typescript
const weatherTool = {
  name: 'weather',
  description: 'Get weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    }
  },
  handler: async ({ location }) => {
    return { weather: 'sunny', temp: 72 };
  }
};

// User message: "What's the weather in London?"
// Agent will automatically:
// 1. Decide to use the weather tool
// 2. Call handler({ location: 'London' })
// 3. Incorporate result into response
// 4. Reply: "The weather in London is sunny with a temperature of 72°F"
```

## Session Lifecycle

```typescript
// 1. Create
const session = new RealtimeSession(agent, config);

// 2. Connect
await session.connect({ apiKey });

// 3. Use
// ... send messages, receive responses ...

// 4. Clean up (when user disconnects)
await session.disconnect();
```

## Event Reference

Common events you can listen to:

```typescript
session.on('conversation.item.created', (event) => {
  // New message added (user or assistant)
});

session.on('response.text.delta', (event) => {
  // Streaming text chunk
  console.log(event.delta);
});

session.on('response.text.done', (event) => {
  // Complete response
  console.log(event.text);
});

session.on('response.done', () => {
  // Response generation complete
});

session.on('tool_approval_requested', (context, agent, request) => {
  // Tool needs approval
  await session.approve(request.approvalItem);
});

session.on('error', (error) => {
  // Error occurred
  console.error(error);
});
```

## Summary

**For your use case** (using the agent in `processMessage`):

The **Transport Layer approach (Example 4)** is what we implemented and is recommended because:

1. ✅ Handles all message routing automatically
2. ✅ Supports streaming responses
3. ✅ Clean separation of concerns
4. ✅ No manual event handling needed
5. ✅ Same pattern as Twilio (audio mode)

The session configuration is simple:
```typescript
config: {
  modalities: ['text'],  // This is the key setting for text mode!
  turn_detection: null,
}
```

The agent then works exactly the same way whether you're using audio or text!

