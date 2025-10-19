import type { WebSocket } from '@fastify/websocket';
import { RealtimeSession } from '@openai/agents/realtime';

interface BrowserMessage {
  type: 'message' | 'ping';
  content?: string;
}

interface OpenAIMessage {
  type: string;
  text?: string;
  [key: string]: any;
}

/**
 * Browser Chat Transport Layer
 * Acts as a bridge between browser WebSocket and OpenAI Realtime API
 * Handles bidirectional communication: Browser ↔ Server ↔ OpenAI
 */
export class BrowserChatTransportLayer {
  private browserWebSocket: WebSocket;
  private openAISession: RealtimeSession | null = null;
  private isConnectedToOpenAI: boolean = false;
  
  public status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' = 'disconnected';
  public readonly muted: boolean | null = null;

  constructor({ browserWebSocket }: { browserWebSocket: WebSocket }) {
    this.browserWebSocket = browserWebSocket;
    this.setupBrowserWebSocket();
  }

  /**
   * Setup browser WebSocket event handlers
   * Handles messages from browser and forwards them to OpenAI
   */
  private setupBrowserWebSocket(): void {
    this.browserWebSocket.on('message', (data: Buffer) => {
      try {
        const message: BrowserMessage = JSON.parse(data.toString());
        
        if (message.type === 'ping') {
          this.sendToBrowser({ type: 'pong' });
          return;
        }

        if (message.type === 'message' && message.content) {
          console.log('[BrowserTransport] User message:', message.content);
          this.forwardMessageToOpenAI(message.content);
        }
      } catch (error) {
        console.error('[BrowserTransport] Error parsing browser message:', error);
        this.sendToBrowser({ type: 'error', message: 'Failed to parse message' });
      }
    });

    this.browserWebSocket.on('close', () => {
      console.log('[BrowserTransport] Browser WebSocket closed');
      this.status = 'disconnected';
      this.disconnectFromOpenAI();
    });

    this.browserWebSocket.on('error', (error: Error) => {
      console.error('[BrowserTransport] Browser WebSocket error:', error);
      this.sendToBrowser({ type: 'error', message: 'WebSocket connection error' });
    });

    this.status = 'connected';
    console.log('[BrowserTransport] Browser WebSocket ready');
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connectToOpenAI(session: RealtimeSession, apiKey: string): Promise<void> {
    try {
      console.log('[BrowserTransport] Connecting to OpenAI...');
      this.openAISession = session;
      
      // Setup OpenAI session event handlers
      this.setupOpenAIEventHandlers();
      
      // Connect to OpenAI
      await session.connect({ apiKey });
      this.isConnectedToOpenAI = true;
      
      console.log('[BrowserTransport] Connected to OpenAI Realtime API');
      this.sendToBrowser({ type: 'openai_connected' });
      
    } catch (error) {
      console.error('[BrowserTransport] Failed to connect to OpenAI:', error);
      this.sendToBrowser({ type: 'error', message: 'Failed to connect to OpenAI' });
      throw error;
    }
  }

  /**
   * Setup OpenAI session event handlers
   * Handles responses from OpenAI and forwards them to browser
   */
  private setupOpenAIEventHandlers(): void {
    if (!this.openAISession) return;

    // Handle text responses from OpenAI
    this.openAISession.transport.on('response.text.delta', (event: OpenAIMessage) => {
      this.sendToBrowser({
        type: 'assistant.message.delta',
        text: event.delta || '',
      });
    });

    this.openAISession.transport.on('response.text.done', (event: OpenAIMessage) => {
      console.log('[BrowserTransport] OpenAI response done:', event.text);
      this.sendToBrowser({
        type: 'assistant.message',
        text: event.text || '',
      });
      this.sendToBrowser({ type: 'response.done' });
    });

    // Handle errors from OpenAI
    this.openAISession.transport.on('error', (event: OpenAIMessage) => {
      console.error('[BrowserTransport] OpenAI error:', event);
      this.sendToBrowser({
        type: 'error',
        message: 'OpenAI API error',
        details: event,
      });
    });

    // Handle tool calls if needed
    this.openAISession.on('tool_approval_requested', (_context, _agent, approvalRequest) => {
      console.log('[BrowserTransport] Tool approval requested:', approvalRequest.tool.name);
      // Auto-approve for now, could be made configurable
      this.openAISession?.approve(approvalRequest.approvalItem)
        .catch((error: unknown) => {
          console.error('[BrowserTransport] Failed to approve tool call:', error);
        });
    });
  }

  /**
   * Forward user message to OpenAI
   */
  private forwardMessageToOpenAI(messageContent: string): void {
    if (!this.openAISession || !this.isConnectedToOpenAI) {
      console.error('[BrowserTransport] Not connected to OpenAI');
      this.sendToBrowser({ type: 'error', message: 'Not connected to OpenAI' });
      return;
    }

    try {
      // Send user message to OpenAI
      this.openAISession.transport.sendEvent({
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
      this.openAISession.transport.sendEvent({
        type: 'response.create',
      });

      console.log('[BrowserTransport] Forwarded message to OpenAI:', messageContent);
    } catch (error) {
      console.error('[BrowserTransport] Error forwarding message to OpenAI:', error);
      this.sendToBrowser({ type: 'error', message: 'Failed to send message to OpenAI' });
    }
  }

  /**
   * Disconnect from OpenAI
   */
  private disconnectFromOpenAI(): void {
    if (this.openAISession && this.isConnectedToOpenAI) {
      console.log('[BrowserTransport] Disconnecting from OpenAI...');
      // The session will handle cleanup when the transport is closed
      this.isConnectedToOpenAI = false;
      this.openAISession = null;
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
   * Send a message directly to OpenAI (public API)
   */
  sendMessageToOpenAI(messageContent: string): void {
    this.forwardMessageToOpenAI(messageContent);
  }

  /**
   * Check if connected to both browser and OpenAI
   */
  isFullyConnected(): boolean {
    return this.status === 'connected' && 
           this.browserWebSocket.readyState === 1 && 
           this.isConnectedToOpenAI;
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
      openAIConnected: this.isConnectedToOpenAI,
      transportStatus: this.status,
    };
  }

  /**
   * Close all connections
   */
  close(): void {
    if (this.status !== 'disconnected') {
      console.log('[BrowserTransport] Closing all connections...');
      this.status = 'disconnecting';
      
      // Disconnect from OpenAI first
      this.disconnectFromOpenAI();
      
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
}

