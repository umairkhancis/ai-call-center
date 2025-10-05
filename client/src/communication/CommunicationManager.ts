// Abstract base class for communication management (client-side)

import { Message, MessageType, CommunicationConfig, Logger, ConsoleLogger } from '../../../shared/types';

export abstract class CommunicationManager {
  protected connectionType: 'websocket' | 'webrtc';
  protected eventHandlers: Map<string, Function[]>;
  protected connection: any;
  protected isConnected: boolean;
  protected logger: Logger;
  protected config: CommunicationConfig;

  constructor(config: CommunicationConfig) {
    this.connectionType = config.type;
    this.eventHandlers = new Map();
    this.connection = null;
    this.isConnected = false;
    this.config = config;
    this.logger = new ConsoleLogger(`CommunicationManager-${config.type}`);

    this.logger.debug('Initialized CommunicationManager', {
      connectionType: this.connectionType,
      config: this.config
    });
  }

  // Abstract methods that both protocols must implement
  abstract connect(target: string): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendMessage(message: Partial<Message>): Promise<void>;
  abstract onMessage(callback: (message: Message) => void): void;
  abstract onConnectionChange(callback: (connected: boolean) => void): void;

  // Common utility methods
  protected emit(event: string, data?: any): void {
    this.logger.debug('Emitting event', { event, hasData: !!data });

    const handlers = this.eventHandlers.get(event) || [];

    if (handlers.length === 0) {
      this.logger.warn('No handlers registered for event', { event });
      return;
    }

    handlers.forEach((handler, index) => {
      try {
        this.logger.debug('Calling event handler', { event, handlerIndex: index });
        handler(data);
      } catch (error) {
        this.logger.error('Error in event handler', {
          event,
          handlerIndex: index,
          error: error instanceof Error ? error.message : error
        });
      }
    });
  }

  protected addEventHandler(event: string, handler: Function): void {
    this.logger.debug('Adding event handler', { event });

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    this.eventHandlers.get(event)!.push(handler);

    this.logger.debug('Event handler added', {
      event,
      totalHandlers: this.eventHandlers.get(event)!.length
    });
  }

  protected generateClientId(): string {
    const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.logger.debug('Generated client ID', { id });
    return id;
  }

  // Getters for status information
  get connected(): boolean {
    return this.isConnected;
  }

  get type(): 'websocket' | 'webrtc' {
    return this.connectionType;
  }

  // Enable/disable verbose logging
  setLogger(logger: Logger): void {
    this.logger = logger;
    this.logger.info('Logger updated for CommunicationManager');
  }
}