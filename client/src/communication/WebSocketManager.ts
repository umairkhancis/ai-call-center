// WebSocket implementation of CommunicationManager for client

import { CommunicationManager } from './CommunicationManager';
import { Message, MessageType, CommunicationConfig, createMessage } from '../../../shared/types';

export class WebSocketManager extends CommunicationManager {
  private ws: WebSocket | null = null;
  private clientId: string;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: CommunicationConfig) {
    super(config);
    this.clientId = this.generateClientId();

    this.logger.info('WebSocketManager initialized', {
      clientId: this.clientId,
      serverUrl: config.serverUrl,
      reconnectInterval: config.reconnectInterval,
      maxReconnectAttempts: config.maxReconnectAttempts
    });
  }

  async connect(serverUrl: string): Promise<void> {
    this.logger.info('Attempting WebSocket connection', { serverUrl });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl);
        this.connection = this.ws;

        this.logger.debug('WebSocket instance created', {
          readyState: this.ws.readyState,
          url: this.ws.url
        });

        this.ws.onopen = () => {
          this.logger.info('WebSocket connection opened successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          this.emit('connected');

          // Send handshake message
          this.sendHandshakeMessage().catch(error => {
            this.logger.error('Failed to send handshake', { error: error.message });
          });

          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this.logger.debug('Received WebSocket message', {
            dataType: typeof event.data,
            dataLength: event.data.length
          });

          try {
            const message: Message = JSON.parse(event.data);

            this.logger.info('Parsed incoming message', {
              messageId: message.id,
              type: message.type,
              sender: message.sender,
              recipient: message.recipient,
              timestamp: message.timestamp,
              payloadKeys: Object.keys(message.payload)
            });

            this.emit('message', message);
          } catch (error) {
            this.logger.error('Failed to parse incoming message', {
              error: error instanceof Error ? error.message : error,
              rawData: event.data
            });
          }
        };

        this.ws.onclose = (event: CloseEvent) => {
          this.logger.warn('WebSocket connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });

          this.isConnected = false;
          this.emit('disconnected');

          // Attempt reconnection if not a clean close
          if (!event.wasClean && this.shouldReconnect()) {
            this.scheduleReconnect(serverUrl);
          }
        };

        this.ws.onerror = (error: Event) => {
          this.logger.error('WebSocket error occurred', {
            error: error.type,
            readyState: this.ws?.readyState
          });

          this.emit('error', error);
          reject(new Error(`WebSocket connection failed: ${error.type}`));
        };

      } catch (error) {
        this.logger.error('Failed to create WebSocket connection', {
          error: error instanceof Error ? error.message : error
        });
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting WebSocket');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.logger.debug('Cleared reconnect timer');
    }

    if (this.ws) {
      const previousState = this.ws.readyState;

      this.ws.close(1000, 'Client requested disconnect');
      this.ws = null;
      this.isConnected = false;

      this.logger.info('WebSocket disconnected', {
        previousState,
        finalState: 'closed'
      });
    } else {
      this.logger.debug('WebSocket was already null during disconnect');
    }
  }

  async sendMessage(messageData: Partial<Message>): Promise<void> {
    if (!this.isConnected || !this.ws) {
      const error = 'Cannot send message: WebSocket not connected';
      this.logger.error(error, {
        isConnected: this.isConnected,
        hasWebSocket: !!this.ws,
        wsReadyState: this.ws?.readyState
      });
      throw new Error(error);
    }

    const message = createMessage(
      messageData.type || MessageType.DATA,
      messageData.payload || {},
      this.clientId,
      messageData.recipient
    );

    this.logger.info('Sending message via WebSocket', {
      messageId: message.id,
      type: message.type,
      recipient: message.recipient,
      payloadKeys: Object.keys(message.payload)
    });

    try {
      const jsonMessage = JSON.stringify(message);
      this.ws.send(jsonMessage);

      this.logger.debug('Message sent successfully', {
        messageId: message.id,
        jsonLength: jsonMessage.length
      });
    } catch (error) {
      this.logger.error('Failed to send message', {
        error: error instanceof Error ? error.message : error,
        messageId: message.id
      });
      throw error;
    }
  }

  onMessage(callback: (message: Message) => void): void {
    this.logger.debug('Registering message callback');
    this.addEventHandler('message', callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.logger.debug('Registering connection change callbacks');
    this.addEventHandler('connected', () => {
      this.logger.debug('Triggering connected callback');
      callback(true);
    });
    this.addEventHandler('disconnected', () => {
      this.logger.debug('Triggering disconnected callback');
      callback(false);
    });
  }

  private async sendHandshakeMessage(): Promise<void> {
    this.logger.debug('Sending handshake message');

    try {
      await this.sendMessage({
        type: MessageType.HANDSHAKE,
        payload: {
          clientId: this.clientId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        }
      });

      this.logger.info('Handshake message sent successfully');
    } catch (error) {
      this.logger.error('Failed to send handshake message', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  private shouldReconnect(): boolean {
    const shouldReconnect = this.reconnectAttempts < (this.config.maxReconnectAttempts || 3);

    this.logger.debug('Checking if should reconnect', {
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      shouldReconnect
    });

    return shouldReconnect;
  }

  private scheduleReconnect(serverUrl: string): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval || 5000;

    this.logger.info('Scheduling reconnection attempt', {
      attempt: this.reconnectAttempts,
      delay,
      serverUrl
    });

    this.reconnectTimer = setTimeout(() => {
      this.logger.info('Executing reconnection attempt', {
        attempt: this.reconnectAttempts
      });

      this.connect(serverUrl).catch(error => {
        this.logger.error('Reconnection attempt failed', {
          attempt: this.reconnectAttempts,
          error: error.message
        });
      });
    }, delay);
  }

  // Additional utility methods for debugging
  getConnectionState(): string {
    if (!this.ws) return 'NO_WEBSOCKET';

    const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return states[this.ws.readyState] || 'UNKNOWN';
  }

  getClientId(): string {
    return this.clientId;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}