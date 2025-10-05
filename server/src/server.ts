// Simple server application demonstrating WebSocket communication

import { WebSocketServer } from './communication/WebSocketServer';
import { createServerConfig } from '../../shared/config';
import { Message, MessageType, ClientInfo } from '../../shared/types';

class SimpleServer {
  private communicationServer: WebSocketServer;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    const config = createServerConfig();
    this.communicationServer = new WebSocketServer(config);

    this.setupEventHandlers();

    console.info('[SERVER] Simple Server initialized successfully', {
      config,
      startTime: this.startTime.toISOString()
    });
  }

  private setupEventHandlers(): void {
    // Handle new client connections
    this.communicationServer.onClientConnect((client: ClientInfo) => {
      console.info('[SERVER] New client connected', {
        clientId: client.id,
        ip: client.ip,
        connectedAt: client.connectedAt.toISOString(),
        totalClients: this.communicationServer.clientCount
      });

      // Send welcome message to new client
      this.sendWelcomeMessage(client).catch(error => {
        console.error('[SERVER] Failed to send welcome message', {
          clientId: client.id,
          error: error.message
        });
      });

      // Notify other clients about new connection
      this.notifyClientsAboutNewConnection(client).catch(error => {
        console.error('[SERVER] Failed to notify clients about new connection', {
          clientId: client.id,
          error: error.message
        });
      });
    });

    // Handle client disconnections
    this.communicationServer.onClientDisconnect((client: ClientInfo) => {
      const connectionDuration = Date.now() - client.connectedAt.getTime();

      console.info('[SERVER] Client disconnected', {
        clientId: client.id,
        ip: client.ip,
        connectionDuration: `${Math.round(connectionDuration / 1000)}s`,
        remainingClients: this.communicationServer.clientCount
      });

      // Notify remaining clients about disconnection
      this.notifyClientsAboutDisconnection(client).catch(error => {
        console.error('[SERVER] Failed to notify clients about disconnection', {
          clientId: client.id,
          error: error.message
        });
      });
    });

    // Handle incoming messages
    this.communicationServer.onMessage(({ message, client }: { message: Message, client: ClientInfo }) => {
      console.info('[SERVER] Received message from client', {
        messageId: message.id,
        type: message.type,
        sender: message.sender,
        clientId: client.id,
        payloadKeys: Object.keys(message.payload)
      });

      // Process message based on type
      this.processMessage(message, client).catch(error => {
        console.error('[SERVER] Failed to process message', {
          messageId: message.id,
          clientId: client.id,
          error: error.message
        });
      });
    });

    console.info('[SERVER] Event handlers set up successfully');
  }

  private async sendWelcomeMessage(client: ClientInfo): Promise<void> {
    const welcomeMessage = {
      type: MessageType.STATUS,
      payload: {
        message: 'Welcome to AI Call Center!',
        serverTime: new Date().toISOString(),
        clientId: client.id,
        serverUptime: Date.now() - this.startTime.getTime(),
        connectedClients: this.communicationServer.clientCount
      }
    };

    await this.communicationServer.sendToClient(client.id, welcomeMessage);

    console.info('[SERVER] Welcome message sent successfully', {
      clientId: client.id
    });
  }

  private async notifyClientsAboutNewConnection(newClient: ClientInfo): Promise<void> {
    const notificationMessage = {
      type: MessageType.STATUS,
      payload: {
        event: 'client_connected',
        clientId: newClient.id,
        totalClients: this.communicationServer.clientCount,
        timestamp: Date.now()
      }
    };

    // Send to all clients except the new one
    const clientIds = this.communicationServer.getClientIds()
      .filter(id => id !== newClient.id);

    for (const clientId of clientIds) {
      try {
        await this.communicationServer.sendToClient(clientId, notificationMessage);
      } catch (error) {
        console.warn('[SERVER] Failed to notify client about new connection', {
          targetClientId: clientId,
          error: error instanceof Error ? error.message : error
        });
      }
    }
  }

  private async notifyClientsAboutDisconnection(disconnectedClient: ClientInfo): Promise<void> {
    const notificationMessage = {
      type: MessageType.STATUS,
      payload: {
        event: 'client_disconnected',
        clientId: disconnectedClient.id,
        totalClients: this.communicationServer.clientCount,
        timestamp: Date.now()
      }
    };

    try {
      await this.communicationServer.broadcastMessage(notificationMessage);
      console.info('[SERVER] Disconnection notification sent to all clients');
    } catch (error) {
      console.error('[SERVER] Failed to broadcast disconnection notification', {
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private async processMessage(message: Message, client: ClientInfo): Promise<void> {
    switch (message.type) {
      case MessageType.HANDSHAKE:
        await this.handleHandshakeMessage(message, client);
        break;

      case MessageType.DATA:
        await this.handleDataMessage(message, client);
        break;

      case MessageType.COMMAND:
        await this.handleCommandMessage(message, client);
        break;

      case MessageType.HEARTBEAT:
        await this.handleHeartbeatMessage(message, client);
        break;

      default:
        console.warn('[SERVER] Unknown message type received', {
          messageId: message.id,
          type: message.type,
          clientId: client.id
        });

        await this.sendErrorResponse(client, `Unknown message type: ${message.type}`);
    }
  }

  private async handleHandshakeMessage(message: Message, client: ClientInfo): Promise<void> {
    console.info('[SERVER] Processing handshake message', {
      messageId: message.id,
      clientId: client.id,
      payload: message.payload
    });

    // Handshake is already handled by WebSocketServer
    // This is just for additional application-level processing
  }

  private async handleDataMessage(message: Message, client: ClientInfo): Promise<void> {
    console.info('[SERVER] Processing data message', {
      messageId: message.id,
      clientId: client.id,
      messagePayload: message.payload.text
    });

    // Echo the message back to the sender with server processing info
    const echoMessage = {
      type: MessageType.DATA,
      payload: {
        originalMessage: message.payload.text || 'No text content',
        echo: true,
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - message.timestamp,
        serverResponse: 'Message received and processed successfully'
      }
    };

    await this.communicationServer.sendToClient(client.id, echoMessage);

    console.info('[SERVER] Echo message sent back to client', {
      originalMessageId: message.id,
      clientId: client.id
    });

    // Optionally broadcast to other clients
    if (message.payload.broadcast) {
      const broadcastMessage = {
        type: MessageType.DATA,
        payload: {
          fromClient: client.id,
          message: message.payload.text,
          broadcastAt: new Date().toISOString()
        }
      };

      const otherClientIds = this.communicationServer.getClientIds()
        .filter(id => id !== client.id);

      for (const clientId of otherClientIds) {
        try {
          await this.communicationServer.sendToClient(clientId, broadcastMessage);
        } catch (error) {
          console.warn('[SERVER] Failed to broadcast to client', {
            targetClientId: clientId,
            error: error instanceof Error ? error.message : error
          });
        }
      }
    }
  }

  private async handleCommandMessage(message: Message, client: ClientInfo): Promise<void> {
    console.info('[SERVER] Processing command message', {
      messageId: message.id,
      clientId: client.id,
      command: message.payload.command
    });

    const command = message.payload.command;
    let response;

    switch (command) {
      case 'status':
        response = {
          serverStatus: 'running',
          uptime: Date.now() - this.startTime.getTime(),
          connectedClients: this.communicationServer.clientCount,
          serverTime: new Date().toISOString()
        };
        break;

      case 'clients':
        response = {
          clientIds: this.communicationServer.getClientIds(),
          totalClients: this.communicationServer.clientCount
        };
        break;

      case 'ping':
        response = {
          pong: true,
          timestamp: Date.now(),
          roundTrip: Date.now() - message.timestamp
        };
        break;

      default:
        console.warn('[SERVER] Unknown command received', {
          command,
          clientId: client.id
        });
        await this.sendErrorResponse(client, `Unknown command: ${command}`);
        return;
    }

    const commandResponse = {
      type: MessageType.COMMAND,
      payload: {
        command,
        response,
        processedAt: new Date().toISOString()
      }
    };

    await this.communicationServer.sendToClient(client.id, commandResponse);

    console.info('[SERVER] Command response sent', {
      command,
      clientId: client.id
    });
  }

  private async handleHeartbeatMessage(message: Message, client: ClientInfo): Promise<void> {
    const heartbeatResponse = {
      type: MessageType.HEARTBEAT,
      payload: {
        serverTime: Date.now(),
        clientTime: message.payload.clientTime,
        latency: Date.now() - message.timestamp
      }
    };

    await this.communicationServer.sendToClient(client.id, heartbeatResponse);
  }

  private async sendErrorResponse(client: ClientInfo, errorMessage: string): Promise<void> {
    const errorResponse = {
      type: MessageType.ERROR,
      payload: {
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    };

    try {
      await this.communicationServer.sendToClient(client.id, errorResponse);
    } catch (error) {
      console.error('[SERVER] Failed to send error response', {
        clientId: client.id,
        originalError: errorMessage,
        sendError: error instanceof Error ? error.message : error
      });
    }
  }

  public async start(): Promise<void> {
    console.info('[SERVER] Starting server');

    try {
      await this.communicationServer.start();

      console.info('[SERVER] Server started successfully', {
        port: this.communicationServer.serverPort,
        protocol: this.communicationServer.serverProtocol,
        startTime: this.startTime.toISOString()
      });

    } catch (error) {
      console.error('[SERVER] Failed to start server', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  public async stop(): Promise<void> {
    console.info('[SERVER] Stopping server');

    try {
      await this.communicationServer.stop();

      const uptime = Date.now() - this.startTime.getTime();
      console.info('[SERVER] Server stopped successfully', {
        uptime: `${Math.round(uptime / 1000)}s`
      });

    } catch (error) {
      console.error('[SERVER] Error during server shutdown', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Utility methods for monitoring
  public getServerStatus(): object {
    return {
      uptime: Date.now() - this.startTime.getTime(),
      startTime: this.startTime.toISOString(),
      connectedClients: this.communicationServer.clientCount,
      clientIds: this.communicationServer.getClientIds(),
      ...this.communicationServer.getServerStatus()
    };
  }
}

// Start the server
async function main() {
  console.info('[MAIN] Starting AI Call Center Server');

  const server = new SimpleServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.info('[MAIN] Received SIGINT, shutting down gracefully');
    try {
      await server.stop();
      process.exit(0);
    } catch (error) {
      console.error('[MAIN] Error during shutdown', error);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    console.info('[MAIN] Received SIGTERM, shutting down gracefully');
    try {
      await server.stop();
      process.exit(0);
    } catch (error) {
      console.error('[MAIN] Error during shutdown', error);
      process.exit(1);
    }
  });

  try {
    await server.start();

    // Make server available globally for debugging
    (global as any).server = server;

    console.info('[MAIN] Server is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('[MAIN] Failed to start server', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('[MAIN] Unhandled error in main function', error);
    process.exit(1);
  });
}