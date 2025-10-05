// WebSocket implementation of CommunicationServer

import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { CommunicationServer } from './CommunicationServer';
import { Message, MessageType, ClientInfo, ServerConfig, createMessage } from '../../../shared/types';

export class WebSocketServer extends CommunicationServer {
  private wss: WebSocket.Server | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: ServerConfig) {
    super(config);

    this.logger.info('WebSocketServer initialized', {
      port: this.port,
      protocol: this.protocol,
      heartbeatInterval: config.heartbeatInterval
    });
  }

  async start(): Promise<void> {
    this.logger.info('Starting WebSocket server', { port: this.port });

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({
          port: this.port,
          perMessageDeflate: false // Disable compression for debugging
        });

        this.wss.on('listening', () => {
          this.logger.info('WebSocket server is listening', {
            port: this.port,
            address: this.wss?.address()
          });
          resolve();
        });

        this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
          this.handleNewConnection(ws, request);
        });

        this.wss.on('error', (error: Error) => {
          this.logger.error('WebSocket server error', {
            error: error.message,
            stack: error.stack
          });
          reject(error);
        });

        // Start heartbeat mechanism if configured
        if (this.config.heartbeatInterval) {
          this.startHeartbeat();
        }

      } catch (error) {
        this.logger.error('Failed to start WebSocket server', {
          error: error instanceof Error ? error.message : error
        });
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping WebSocket server');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.logger.debug('Stopped heartbeat mechanism');
    }

    // Close all client connections
    this.clients.forEach(client => {
      this.logger.debug('Closing client connection', { clientId: client.id });
      if (client.connection.readyState === WebSocket.OPEN) {
        client.connection.close(1001, 'Server shutting down');
      }
    });

    // Close server
    if (this.wss) {
      return new Promise((resolve) => {
        this.wss!.close(() => {
          this.logger.info('WebSocket server stopped');
          this.wss = null;
          resolve();
        });
      });
    }
  }

  async broadcastMessage(messageData: Partial<Message>): Promise<void> {
    const message = createMessage(
      messageData.type || MessageType.DATA,
      messageData.payload || {},
      'server',
      'all'
    );

    this.logger.info('Broadcasting message to all clients', {
      messageId: message.id,
      type: message.type,
      clientCount: this.clients.size,
      payloadKeys: Object.keys(message.payload)
    });

    const jsonMessage = JSON.stringify(message);
    let sentCount = 0;
    let errorCount = 0;

    this.clients.forEach(client => {
      try {
        if (client.connection.readyState === WebSocket.OPEN) {
          client.connection.send(jsonMessage);
          sentCount++;

          this.logger.debug('Message sent to client', {
            messageId: message.id,
            clientId: client.id
          });
        } else {
          this.logger.warn('Skipping client with non-open connection', {
            clientId: client.id,
            readyState: client.connection.readyState
          });
        }
      } catch (error) {
        errorCount++;
        this.logger.error('Failed to send message to client', {
          clientId: client.id,
          error: error instanceof Error ? error.message : error
        });
      }
    });

    this.logger.info('Broadcast completed', {
      messageId: message.id,
      sentCount,
      errorCount,
      totalClients: this.clients.size
    });
  }

  async sendToClient(clientId: string, messageData: Partial<Message>): Promise<void> {
    const client = this.findClient(clientId);

    if (!client) {
      const error = `Client ${clientId} not found`;
      this.logger.error(error);
      throw new Error(error);
    }

    if (client.connection.readyState !== WebSocket.OPEN) {
      const error = `Client ${clientId} connection not open (state: ${client.connection.readyState})`;
      this.logger.error(error);
      throw new Error(error);
    }

    const message = createMessage(
      messageData.type || MessageType.DATA,
      messageData.payload || {},
      'server',
      clientId
    );

    this.logger.info('Sending message to specific client', {
      messageId: message.id,
      type: message.type,
      clientId: client.id,
      payloadKeys: Object.keys(message.payload)
    });

    try {
      const jsonMessage = JSON.stringify(message);
      client.connection.send(jsonMessage);

      this.logger.debug('Message sent successfully to client', {
        messageId: message.id,
        clientId: client.id,
        jsonLength: jsonMessage.length
      });
    } catch (error) {
      this.logger.error('Failed to send message to client', {
        clientId: client.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  onClientConnect(callback: (client: ClientInfo) => void): void {
    this.logger.debug('Registering client connect callback');
    this.addEventHandler('clientConnected', callback);
  }

  onClientDisconnect(callback: (client: ClientInfo) => void): void {
    this.logger.debug('Registering client disconnect callback');
    this.addEventHandler('clientDisconnected', callback);
  }

  onMessage(callback: (data: { message: Message, client: ClientInfo }) => void): void {
    this.logger.debug('Registering message callback');
    this.addEventHandler('message', callback);
  }

  private handleNewConnection(ws: WebSocket, request: IncomingMessage): void {
    const client: ClientInfo = {
      id: this.generateClientId(),
      connection: ws,
      ip: request.socket.remoteAddress,
      connectedAt: new Date()
    };

    this.logger.info('New WebSocket connection established', {
      clientId: client.id,
      ip: client.ip,
      userAgent: request.headers['user-agent'],
      origin: request.headers.origin
    });

    this.addClient(client);
    this.emit('clientConnected', client);

    // Set up message handler
    ws.on('message', (data: WebSocket.Data) => {
      this.handleClientMessage(data, client);
    });

    // Set up close handler
    ws.on('close', (code: number, reason: Buffer) => {
      this.logger.info('Client connection closed', {
        clientId: client.id,
        code,
        reason: reason.toString(),
        duration: Date.now() - client.connectedAt.getTime()
      });

      this.removeClient(client);
      this.emit('clientDisconnected', client);
    });

    // Set up error handler
    ws.on('error', (error: Error) => {
      this.logger.error('Client connection error', {
        clientId: client.id,
        error: error.message
      });
    });

    // Set up pong handler for heartbeat
    ws.on('pong', () => {
      this.logger.debug('Received pong from client', { clientId: client.id });
    });
  }

  private handleClientMessage(data: WebSocket.Data, client: ClientInfo): void {
    this.logger.debug('Received message from client', {
      clientId: client.id,
      dataType: typeof data,
      dataLength: data.toString().length
    });

    try {
      const message: Message = JSON.parse(data.toString());

      this.logger.info('Parsed client message', {
        messageId: message.id,
        type: message.type,
        sender: message.sender,
        recipient: message.recipient,
        clientId: client.id,
        timestamp: message.timestamp,
        payloadKeys: Object.keys(message.payload)
      });

      // Handle handshake messages
      if (message.type === MessageType.HANDSHAKE) {
        this.handleHandshakeMessage(message, client);
      }

      this.emit('message', { message, client });

    } catch (error) {
      this.logger.error('Failed to parse client message', {
        clientId: client.id,
        error: error instanceof Error ? error.message : error,
        rawData: data.toString()
      });

      this.sendError(client, 'Invalid message format');
    }
  }

  private handleHandshakeMessage(message: Message, client: ClientInfo): void {
    this.logger.info('Processing handshake message', {
      clientId: client.id,
      messageClientId: message.payload.clientId,
      userAgent: message.payload.userAgent
    });

    // Send handshake response
    this.sendToClient(client.id, {
      type: MessageType.HANDSHAKE,
      payload: {
        serverTime: Date.now(),
        clientId: client.id,
        status: 'connected'
      }
    }).catch(error => {
      this.logger.error('Failed to send handshake response', {
        clientId: client.id,
        error: error.message
      });
    });
  }

  private sendError(client: ClientInfo, errorMessage: string): void {
    this.logger.warn('Sending error message to client', {
      clientId: client.id,
      errorMessage
    });

    const errorMsg = createMessage(
      MessageType.ERROR,
      { error: errorMessage },
      'server',
      client.id
    );

    if (client.connection.readyState === WebSocket.OPEN) {
      try {
        client.connection.send(JSON.stringify(errorMsg));
        this.logger.debug('Error message sent to client', {
          clientId: client.id,
          messageId: errorMsg.id
        });
      } catch (error) {
        this.logger.error('Failed to send error message to client', {
          clientId: client.id,
          error: error instanceof Error ? error.message : error
        });
      }
    }
  }

  private startHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000;

    this.logger.info('Starting heartbeat mechanism', { interval });

    this.heartbeatInterval = setInterval(() => {
      this.logger.debug('Sending heartbeat ping to all clients', {
        clientCount: this.clients.size
      });

      this.clients.forEach(client => {
        if (client.connection.readyState === WebSocket.OPEN) {
          try {
            client.connection.ping();
            this.logger.debug('Ping sent to client', { clientId: client.id });
          } catch (error) {
            this.logger.error('Failed to ping client', {
              clientId: client.id,
              error: error instanceof Error ? error.message : error
            });
          }
        }
      });
    }, interval);
  }

  // Additional utility methods for debugging
  getServerStatus(): object {
    return {
      isRunning: !!this.wss,
      port: this.port,
      clientCount: this.clients.size,
      clients: this.getClientIds()
    };
  }
}