import type { WebSocket } from '@fastify/websocket';
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

export interface SessionConfig {
  apiKey: string;
  model?: string;
  voice?: string;
}

interface BrowserMessage {
  type: 'message' | 'ping';
  content?: string;
}

interface OpenAIMessage {
  type: string;
  text?: string;
  delta?: string;
  [key: string]: any;
}

/**
 * Browser Chat Session Service
 * 
 * Combines session management and transport layer functionality
 * for browser-based chat interactions with OpenAI Realtime API.
 * 
 * Responsibilities:
 * - Create and manage RealtimeSession instances
 * - Handle WebSocket communication with browsers
 * - Forward messages between browser and OpenAI
 * - Manage connection lifecycle
 * - Handle event processing and tool approvals
 */
export class BrowserChatSessionService {
  private browserWebSocket: WebSocket;
  private realtimeSession: RealtimeSession | null = null;
  private isConnected: boolean = false;
  
  public status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' = 'disconnected';
  public readonly muted: boolean | null = null;

  constructor(browserWebSocket: WebSocket) {
    this.browserWebSocket = browserWebSocket;
    this.setupBrowserEventsHandlers();
  }

  /**
   * Create and connect a browser chat session to OpenAI
   * 
   * @param agent - The RealtimeAgent to use for the session
   * @param config - Session configuration including API key and model
   * @returns Promise that resolves when connection is established
   */
  async createAndConnectSession(agent: RealtimeAgent, config: SessionConfig): Promise<void> {
    try {
      console.log('[BrowserChatSessionService] Creating session...');
      
      // Create RealtimeSession with text-only configuration
      this.realtimeSession = new RealtimeSession(agent, {
        transport: 'websocket',
        model: config.model || 'gpt-realtime',
        config: {
          // Configure for text-only mode (no audio)
          modalities: ['text'],
        },
      });

      // Setup event handlers for the session
      this.setupRealTimeSessionEventsHandlers();

      // Connect
      await this.realtimeSession.connect({ apiKey: config.apiKey });
      this.isConnected = true;

      console.log('[BrowserChatSessionService] Connected to OpenAI Realtime API');
      this.sendToBrowser({ type: 'openai_connected' });

    } catch (error) {
      console.error('[BrowserChatSessionService] Failed to create session:', error);
      this.sendToBrowser({ type: 'error', message: 'Failed to connect to OpenAI' });
      throw error;
    }
  }

  /**
   * Setup browser WebSocket event handlers
   * Handles messages from browser and forwards them to OpenAI
   */
  private setupBrowserEventsHandlers(): void {
    this.browserWebSocket.on('message', (data: Buffer) => {
      try {
        const message: BrowserMessage = JSON.parse(data.toString());
        
        if (message.type === 'ping') {
          this.sendToBrowser({ type: 'pong' });
          return;
        }

        if (message.type === 'message' && message.content) {
          console.log('[BrowserChatSessionService] User message:', message.content);
          this.sendMessage(message.content);
        }
      } catch (error) {
        console.error('[BrowserChatSessionService] Error parsing browser message:', error);
        this.sendToBrowser({ type: 'error', message: 'Failed to parse message' });
      }
    });

    this.browserWebSocket.on('close', () => {
      console.log('[BrowserChatSessionService] Browser WebSocket closed');
      this.status = 'disconnected';
      this.disconnect();
    });

    this.browserWebSocket.on('error', (error: Error) => {
      console.error('[BrowserChatSessionService] Browser WebSocket error:', error);
      this.sendToBrowser({ type: 'error', message: 'WebSocket connection error' });
    });

    this.status = 'connected';
    console.log('[BrowserChatSessionService] Browser WebSocket ready');
  }

  /**
   * Setup OpenAI session event handlers
   * Handles responses from OpenAI and forwards them to browser
   */
  private setupRealTimeSessionEventsHandlers(): void {
    if (!this.realtimeSession) return;

    // Handle text responses from OpenAI
    this.realtimeSession.transport.on('response.text.delta', (event: OpenAIMessage) => {
      this.sendToBrowser({
        type: 'assistant.message.delta',
        text: event.delta || '',
      });
    });

    this.realtimeSession.transport.on('response.text.done', (event: OpenAIMessage) => {
      console.log('[BrowserChatSessionService] OpenAI response done:', event.text);
      this.sendToBrowser({
        type: 'assistant.message',
        text: event.text || '',
      });
      this.sendToBrowser({ type: 'response.done' });
    });

    // Handle errors from OpenAI
    this.realtimeSession.transport.on('error', (event: OpenAIMessage) => {
      console.error('[BrowserChatSessionService] OpenAI error:', event);
      this.sendToBrowser({
        type: 'error',
        message: 'OpenAI API error',
        details: event,
      });
    });

    // Handle tool calls
    this.realtimeSession.on('tool_approval_requested', (_context, _agent, approvalRequest) => {
      console.log('[BrowserChatSessionService] Tool approval requested:', approvalRequest.tool.name);
      // Auto-approve for now, could be made configurable
      this.realtimeSession?.approve(approvalRequest.approvalItem)
        .catch((error: unknown) => {
          console.error('[BrowserChatSessionService] Failed to approve tool call:', error);
        });
    });
  }

  /**
   * Forward user message to OpenAI
   */
  private sendMessage(messageContent: string): void {
    if (!this.realtimeSession || !this.isConnected) {
      console.error('[BrowserChatSessionService] Not connected to OpenAI');
      this.sendToBrowser({ type: 'error', message: 'Not connected to OpenAI' });
      return;
    }

    try {
      // Send user message to OpenAI
      this.realtimeSession.transport.sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: messageContent,
          }],
        },
      });

      // Trigger response generation
      this.realtimeSession.transport.sendEvent({
        type: 'response.create',
      });

      console.log('[BrowserChatSessionService] Message sent to OpenAI:', messageContent);
    } catch (error) {
      console.error('[BrowserChatSessionService] Error forwarding message to OpenAI:', error);
      this.sendToBrowser({ type: 'error', message: 'Failed to send message to OpenAI' });
    }
  }

  /**
   * Disconnect from OpenAI
   */
  private disconnect(): void {
    if (this.realtimeSession && this.isConnected) {
      console.log('[BrowserChatSessionService] Disconnecting from OpenAI...');
      // The session will handle cleanup when the transport is closed
      this.isConnected = false;
      this.realtimeSession = null;
    }
  }

  /**
   * Send message to the browser client
   */
  private sendToBrowser(data: any): void {
    if (this.status === 'connected' && this.browserWebSocket.readyState === 1) {
      this.browserWebSocket.send(JSON.stringify(data));
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    browserConnected: boolean;
    openAIConnected: boolean;
    transportStatus: string;
  } {
    return {
      browserConnected: this.status === 'connected' && this.browserWebSocket.readyState === 1,
      openAIConnected: this.isConnected,
      transportStatus: this.status,
    };
  }

  /**
   * Close all connections
   */
  close(): void {
    if (this.status !== 'disconnected') {
      console.log('[BrowserChatSessionService] Closing all connections...');
      this.status = 'disconnecting';
      
      // Disconnect from OpenAI first
      this.disconnect();
      
      // Close browser WebSocket
      if (this.browserWebSocket.readyState === 1) {
        this.browserWebSocket.close();
      }
      
      this.status = 'disconnected';
    }
  }

  /**
   * Check if browser connection is open
   */
  isOpen(): boolean {
    return this.status === 'connected' && this.browserWebSocket.readyState === 1;
  }

  /**
   * Get the OpenAI session instance (for advanced usage)
   */
  getSession(): RealtimeSession | null {
    return this.realtimeSession;
  }
}
