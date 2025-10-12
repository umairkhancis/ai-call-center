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
  ): RealtimeSession {
    const transportLayer = new BrowserChatTransportLayer({
      browserWebSocket,
    });

    const session = new RealtimeSession(agent, {
      transport: transportLayer as any,
      model: config.model || 'gpt-realtime',
      config: {
        // Configure for text-only mode (no audio)
        modalities: ['text'],
        // Turn transcription can be set to null for text-only mode
        turn_detection: null,
      },
    });

    this.setupEventHandlers(session);

    return session;
  }

  /**
   * Generic session creation (backwards compatible)
   */
  createSession(
    agent: RealtimeAgent,
    webSocket: any,
    config: SessionConfig,
    transportType: TransportType = 'twilio',
  ): RealtimeSession {
    if (transportType === 'browser-chat') {
      return this.createBrowserChatSession(agent, webSocket, config);
    }
    return this.createTwilioSession(agent, webSocket, config);
  }

  private setupEventHandlers(session: RealtimeSession): void {
    session.on(
      'tool_approval_requested',
      (_context, _agent, approvalRequest) => {
        console.log(
          `Approving tool call for ${approvalRequest.tool.name}.`,
        );
        session
          .approve(approvalRequest.approvalItem)
          .catch((error: unknown) =>
            console.error('Failed to approve tool call.', error),
          );
      },
    );
  }

  async connectSession(session: RealtimeSession, apiKey: string): Promise<void> {
    await session.connect({ apiKey });
    console.log('Connected to the OpenAI Realtime API');
  }
}
