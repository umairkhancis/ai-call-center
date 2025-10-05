// Abstract base class for communication server

import { Message, ClientInfo, ServerConfig, Logger, ConsoleLogger } from '../../../shared/types';

export abstract class CommunicationServer {
  protected protocol: 'websocket' | 'webrtc';
  protected clients: Set<ClientInfo>;
  protected messageHandlers: Map<string, Function[]>;
  protected port: number;
  protected logger: Logger;
  protected config: ServerConfig;

  constructor(config: ServerConfig) {
    this.protocol = config.protocol;
    this.clients = new Set();
    this.messageHandlers = new Map();
    this.port = config.port;
    this.config = config;
    this.logger = new ConsoleLogger(`CommunicationServer-${config.protocol}`);

    this.logger.debug('Initialized CommunicationServer', {
      protocol: this.protocol,
      port: this.port,
      config: this.config
    });
  }

  // Abstract methods for protocol handling
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract broadcastMessage(message: Partial<Message>): Promise<void>;
  abstract sendToClient(clientId: string, message: Partial<Message>): Promise<void>;
  abstract onClientConnect(callback: (client: ClientInfo) => void): void;
  abstract onClientDisconnect(callback: (client: ClientInfo) => void): void;
  abstract onMessage(callback: (data: { message: Message, client: ClientInfo }) => void): void;

  // Common utility methods
  protected emit(event: string, data?: any): void {
    this.logger.debug('Emitting server event', { event, hasData: !!data });

    const handlers = this.messageHandlers.get(event) || [];

    if (handlers.length === 0) {
      this.logger.warn('No handlers registered for server event', { event });
      return;
    }

    handlers.forEach((handler, index) => {
      try {
        this.logger.debug('Calling server event handler', { event, handlerIndex: index });
        handler(data);
      } catch (error) {
        this.logger.error('Error in server event handler', {
          event,
          handlerIndex: index,
          error: error instanceof Error ? error.message : error
        });
      }
    });
  }

  protected addEventHandler(event: string, handler: Function): void {
    this.logger.debug('Adding server event handler', { event });

    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }

    this.messageHandlers.get(event)!.push(handler);

    this.logger.debug('Server event handler added', {
      event,
      totalHandlers: this.messageHandlers.get(event)!.length
    });
  }

  protected generateClientId(): string {
    const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.logger.debug('Generated client ID', { id });
    return id;
  }

  // Client management utilities
  protected addClient(client: ClientInfo): void {
    this.clients.add(client);
    this.logger.info('Client added to server', {
      clientId: client.id,
      ip: client.ip,
      totalClients: this.clients.size,
      connectedAt: client.connectedAt
    });
  }

  protected removeClient(client: ClientInfo): void {
    const wasPresent = this.clients.delete(client);
    this.logger.info('Client removed from server', {
      clientId: client.id,
      wasPresent,
      totalClients: this.clients.size
    });
  }

  protected findClient(clientId: string): ClientInfo | undefined {
    const client = Array.from(this.clients).find(c => c.id === clientId);
    this.logger.debug('Client lookup', {
      clientId,
      found: !!client
    });
    return client;
  }

  // Getters for status information
  get clientCount(): number {
    return this.clients.size;
  }

  get serverPort(): number {
    return this.port;
  }

  get serverProtocol(): 'websocket' | 'webrtc' {
    return this.protocol;
  }

  // Get all connected client IDs
  getClientIds(): string[] {
    const ids = Array.from(this.clients).map(client => client.id);
    this.logger.debug('Retrieved client IDs', { count: ids.length, ids });
    return ids;
  }

  // Enable/disable verbose logging
  setLogger(logger: Logger): void {
    this.logger = logger;
    this.logger.info('Logger updated for CommunicationServer');
  }
}