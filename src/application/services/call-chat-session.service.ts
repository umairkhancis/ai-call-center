import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { TwilioRealtimeTransportLayer } from '@openai/agents-extensions';

export interface SessionConfig {
  apiKey: string;
  model?: string;
  voice?: string;
}

/**
 * Call Chat Session Service
 * 
 * Manages Twilio call sessions with OpenAI Realtime API using the transport layer pattern.
 * Similar to BrowserChatSessionService but handles Twilio media streams.
 * 
 * Responsibilities:
 * - Create and manage RealtimeSession instances using Twilio transport
 * - Handle session lifecycle and connection management
 * - Setup event handlers for tool approvals and session events
 * - Provide session status and management methods
 */
export class CallChatSessionService {
  private activeSessions: Map<string, RealtimeSession> = new Map();

  /**
   * Create a new Twilio session with the RealtimeAgent
   * 
   * @param agent - The RealtimeAgent to use for the session
   * @param twilioWebSocket - The Twilio WebSocket connection
   * @param config - Session configuration including API key, model, and voice
   * @returns RealtimeSession instance
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
   * Connect a session to OpenAI Realtime API
   * 
   * @param session - The RealtimeSession to connect
   * @param apiKey - OpenAI API key
   * @returns Promise that resolves when connection is established
   */
  async connectSession(session: RealtimeSession, apiKey: string): Promise<void> {
    try {
      console.log('[CallChatSessionService] Connecting Twilio session to OpenAI...');
      
      await session.connect({ apiKey });
      
      console.log('[CallChatSessionService] Twilio session connected to OpenAI successfully');
    } catch (error) {
      console.error('[CallChatSessionService] Failed to connect session:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for the RealtimeSession
   * Handles tool approvals and session lifecycle events
   */
  private setupEventHandlers(session: RealtimeSession): void {
    // Handle tool approvals - auto-approve for seamless voice experience
    session.on('tool_approval_requested', (_context, _agent, approvalRequest) => {
      console.log(`[CallChatSessionService] Approving tool call for ${approvalRequest.tool.name}`);
      session.approve(approvalRequest.approvalItem)
        .catch((error: unknown) => {
          console.error('[CallChatSessionService] Failed to approve tool call:', error);
        });
    });

    // Handle MCP tool changes (if available)
    // Note: This event may not be available in all versions
    // session.on('mcp_tools_changed', (tools: any[]) => { ... });

    // Handle session errors
    session.transport.on('error', (event: any) => {
      console.error('[CallChatSessionService] Session error:', event);
    });

    // Handle session close
    session.transport.on('close', () => {
      console.log('[CallChatSessionService] Session transport closed');
    });
  }

  /**
   * Get active session count (for monitoring)
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Clean up a specific session
   */
  cleanupSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      console.log(`[CallChatSessionService] Cleaning up session ${sessionId}`);
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Clean up all sessions
   */
  cleanupAllSessions(): void {
    console.log('[CallChatSessionService] Cleaning up all sessions');
    this.activeSessions.clear();
  }
}
