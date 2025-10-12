import type { WebSocket } from '@fastify/websocket';
import { EventEmitter } from 'node:events';

interface BrowserMessage {
  type: 'message' | 'ping';
  content?: string;
}

interface TransportMessage {
  type: string;
  [key: string]: any;
}

/**
 * Browser Chat Transport Layer
 * Adapts browser WebSocket text messages to OpenAI Realtime API format
 * Similar to TwilioRealtimeTransportLayer but for text-based chat
 */
export class BrowserChatTransportLayer extends EventEmitter {
  private webSocket: WebSocket;
  private connected: boolean = false;

  constructor({ browserWebSocket }: { browserWebSocket: WebSocket }) {
    super();
    this.webSocket = browserWebSocket;
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.webSocket.on('message', (data: Buffer) => {
      try {
        const message: BrowserMessage = JSON.parse(data.toString());
        
        if (message.type === 'ping') {
          this.sendToBrowser({ type: 'pong' });
          return;
        }

        if (message.type === 'message' && message.content) {
          // Transform browser message to OpenAI Realtime format
          this.emit('message', {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: message.content,
                },
              ],
            },
          });

          // Trigger response generation
          this.emit('message', {
            type: 'response.create',
          });
        }
      } catch (error) {
        console.error('Error parsing browser message:', error);
      }
    });

    this.webSocket.on('close', () => {
      this.connected = false;
      this.emit('close');
    });

    this.webSocket.on('error', (error: Error) => {
      console.error('Browser WebSocket error:', error);
      this.emit('error', error);
    });

    this.connected = true;
    this.emit('open');
  }

  /**
   * Connect method required by RealtimeSession
   * For browser WebSocket, the connection is already established
   */
  async connect(): Promise<void> {
    // WebSocket is already connected in constructor
    // This method exists to satisfy the transport interface
    return Promise.resolve();
  }

  /**
   * Send message to the browser client
   */
  private sendToBrowser(data: any): void {
    if (this.connected && this.webSocket.readyState === 1) {
      this.webSocket.send(JSON.stringify(data));
    }
  }

  /**
   * Handle messages from OpenAI Realtime API
   * Transform and send to browser
   */
  send(message: TransportMessage): void {
    // Handle different message types from OpenAI
    switch (message.type) {
      case 'response.audio_transcript.delta':
      case 'response.text.delta':
        // Send incremental text updates
        this.sendToBrowser({
          type: 'text.delta',
          delta: message.delta,
        });
        break;

      case 'response.audio_transcript.done':
      case 'response.text.done':
        // Send complete response
        this.sendToBrowser({
          type: 'text.done',
          text: message.text || message.transcript,
        });
        break;

      case 'response.done':
        // Response completed
        this.sendToBrowser({
          type: 'response.done',
        });
        break;

      case 'error':
        // Send error to browser
        this.sendToBrowser({
          type: 'error',
          error: message.error,
        });
        break;

      case 'conversation.item.created':
        // Item created in conversation
        if (message.item?.role === 'assistant') {
          const content = message.item.content?.[0];
          if (content?.text) {
            this.sendToBrowser({
              type: 'assistant.message',
              text: content.text,
            });
          }
        }
        break;
    }
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.connected) {
      this.connected = false;
      this.webSocket.close();
    }
  }

  /**
   * Check if connection is open
   */
  isOpen(): boolean {
    return this.connected && this.webSocket.readyState === 1;
  }
}

