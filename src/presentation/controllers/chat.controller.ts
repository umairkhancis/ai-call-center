import type { FastifyReply, FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { SessionService } from '../../application/services/session.service.js';
import { BrowserChatTransportLayer } from '../../application/transport/browser-chat.transport.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export class ChatController {
  // Store sessions and transports per connection
  private sessions: Map<WebSocket, RealtimeSession> = new Map();
  private transports: Map<WebSocket, BrowserChatTransportLayer> = new Map();

  constructor(
    private readonly agent: RealtimeAgent,
    private readonly sessionService: SessionService,
    private readonly apiKey: string,
  ) {}

  /**
   * Handle browser chat WebSocket connections
   * Connects to OpenAI Realtime API
   */
  async handleChatStream(connection: WebSocket): Promise<void> {
    console.log('[ChatController] Browser chat client connected');

    try {
      // Create a RealtimeSession and BrowserChatTransport
      const { session, transport } = this.sessionService.createSession(
        this.agent,
        connection,
        {
          apiKey: this.apiKey,
          model: 'gpt-realtime',
        },
      );

      // Store session and transport for this connection
      this.sessions.set(connection, session);
      this.transports.set(connection, transport);
      console.log('[ChatController] Session created, active sessions:', this.sessions.size);

      // Connect to OpenAI Realtime API through the transport layer
      await this.sessionService.connectSession({ session, transport }, this.apiKey);
      console.log('[ChatController] Connected to OpenAI Realtime API');

      // Send initial connection confirmation
      connection.send(JSON.stringify({ type: 'connected' }));

      // Handle connection close
      connection.on('close', () => {
        console.log('[ChatController] Browser chat client disconnected');
        // Clean up session and transport
        const transport = this.transports.get(connection);
        if (transport) {
          transport.close();
          this.transports.delete(connection);
        }
        this.sessions.delete(connection);
        console.log('[ChatController] Session cleaned up, active sessions:', this.sessions.size);
      });

      connection.on('error', (error: Error) => {
        console.error('[ChatController] WebSocket error:', error);
        // Clean up session and transport on error
        const transport = this.transports.get(connection);
        if (transport) {
          transport.close();
          this.transports.delete(connection);
        }
        this.sessions.delete(connection);
      });
    } catch (error) {
      console.error('[ChatController] Error handling browser chat stream:', error);
      // Clean up on error
      const transport = this.transports.get(connection);
      if (transport) {
        transport.close();
        this.transports.delete(connection);
      }
      this.sessions.delete(connection);
      connection.close();
    }
  }

  /**
   * Serve the chat interface HTML
   */
  async serveChatInterface(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    reply.type('text/html');
    const publicPath = path.join(__dirname, '..', 'public', 'index.html');
    return reply.sendFile('index.html');
  }

  /**
   * Get chat service status
   */
  async getChatStatus(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    reply.send({
      status: 'online',
      message: 'Browser Chat Service is running!',
      transport: 'browser-chat',
      activeSessions: this.sessions.size,
      activeTransports: this.transports.size,
    });
  }
}