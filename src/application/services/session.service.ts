import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { TwilioRealtimeTransportLayer } from '@openai/agents-extensions';
import { BrowserChatTransportLayer } from '../transport/browser-chat.transport.js';
import type { WebSocket } from '@fastify/websocket';

export interface SessionConfig {
  apiKey: string;
  model?: string;
  voice?: string;
}

export type TransportType = 'twilio' | 'browser-chat';

export class SessionService {
  /**
   * Create a session with Twilio transport
   */
  createTwilioSession(
    agent: RealtimeAgent,
    twilioWebSocket: any,
    config: SessionConfig,
  ): RealtimeSession {
    const transportLayer = new TwilioRealtimeTransportLayer({
      twilioWebSocket,
    });

    const session = new RealtimeSession(agent, {
      transport: transportLayer,
      model: config.model || 'gpt-realtime',
      config: {
        voice: config.voice || 'verse',
      },
    });

    this.setupEventHandlers(session);

    return session;
  }

  /**
   * Create a session with Browser Chat transport
   * Configured for text-only modality
   */
  createBrowserChatSession(
    agent: RealtimeAgent,
    browserWebSocket: WebSocket,
    config: SessionConfig,
  ): { session: RealtimeSession; transport: BrowserChatTransportLayer } {
    // Create the transport layer that manages browser ↔ OpenAI communication
    const transportLayer = new BrowserChatTransportLayer({
      browserWebSocket,
    });

    // Create RealtimeSession with native websocket transport
    const realTimeSession = new RealtimeSession(agent, {
      transport: 'websocket',
      model: config.model || 'gpt-realtime',
      config: {
        // Configure for text-only mode (no audio)
        modalities: ['text'],
      },
    });

    return { session: realTimeSession, transport: transportLayer };
  }

  /**
   * Generic session creation (backwards compatible)
   */
  createSession(
    agent: RealtimeAgent,
    webSocket: any,
    config: SessionConfig,
    transportType: TransportType = 'twilio',
  ): RealtimeSession | { session: RealtimeSession; transport: BrowserChatTransportLayer } {
    if (transportType === 'browser-chat') {
      return this.createBrowserChatSession(agent, webSocket, config);
    }
    return this.createTwilioSession(agent, webSocket, config);
  }

  /**
   * Connect browser chat session to OpenAI
   */
  async connectBrowserChatSession(
    sessionData: { session: RealtimeSession; transport: BrowserChatTransportLayer },
    apiKey: string,
  ): Promise<void> {
    const { session, transport } = sessionData;
    
    // Setup basic session event handlers
    this.setupBasicEventHandlers(session);
    
    // Connect the transport layer to OpenAI (this handles all the event forwarding)
    await transport.connectToOpenAI(session, apiKey);
    
    console.log('[SessionService] Browser chat session connected to OpenAI');
  }

  /**
   * Setup basic event handlers for Twilio sessions
   */
  private setupEventHandlers(realTimeSession: RealtimeSession): void {
    this.setupBasicEventHandlers(realTimeSession);
  }

  /**
   * Setup basic event handlers (tool approval, etc.)
   */
  private setupBasicEventHandlers(realTimeSession: RealtimeSession): void {
    realTimeSession.on(
      'tool_approval_requested',
      (_context, _agent, approvalRequest) => {
        console.log(
          `Approving tool call for ${approvalRequest.tool.name}.`,
        );
        realTimeSession
          .approve(approvalRequest.approvalItem)
          .catch((error: unknown) =>
            console.error('Failed to approve tool call.', error),
          );
      },
    );
  }


  /**
   * Connect a Twilio session to OpenAI (backwards compatible)
   */
  async connectSession(session: RealtimeSession, apiKey: string): Promise<void> {
    await session.connect({ apiKey });
    console.log('Connected to the OpenAI Realtime API');
  }
}
