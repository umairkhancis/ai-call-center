import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { TwilioRealtimeTransportLayer } from '@openai/agents-extensions';

export interface SessionConfig {
  apiKey: string;
  model?: string;
  voice?: string;
}

export class SessionService {
  createSession(
    agent: RealtimeAgent,
    twilioWebSocket: any,
    config: SessionConfig,
  ): RealtimeSession {
    const twilioTransportLayer = new TwilioRealtimeTransportLayer({
      twilioWebSocket,
    });

    const session = new RealtimeSession(agent, {
      transport: twilioTransportLayer,
      model: config.model || 'gpt-realtime',
      config: {
        voice: config.voice || 'verse',
      },
    });

    this.setupEventHandlers(session);

    return session;
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

