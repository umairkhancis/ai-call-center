import type { FastifyReply, FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { SessionService } from '../../application/services/session.service.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatMessage {
  type: 'message' | 'ping';
  content?: string;
}

export class ChatController {
  // Store sessions per connection
  private sessions: Map<WebSocket, RealtimeSession> = new Map();

  constructor(
    private readonly agent: RealtimeAgent,
    private readonly sessionService: SessionService,
    private readonly apiKey: string,
  ) {}

  /**
   * Handle browser chat WebSocket connections
   * Uses Realtime API with text modality
   * The transport layer handles all message routing automatically
   */
  async handleChatStream(connection: WebSocket): Promise<void> {
    console.log('Browser chat client connected');

    try {
      // Create a Realtime session with text modality for this connection
      // The BrowserChatTransportLayer will automatically:
      // 1. Listen to browser messages
      // 2. Transform them to OpenAI Realtime API format
      // 3. Route responses back to the browser
      const session = this.sessionService.createBrowserChatSession(
        this.agent,
        connection,
        {
          apiKey: this.apiKey,
          model: 'gpt-realtime',
        }
      );

      // Store session for cleanup
      this.sessions.set(connection, session);

      // Connect to OpenAI Realtime API
      // After this, the transport layer handles everything automatically
      await this.sessionService.connectSession(session, this.apiKey);
      
      console.log('Browser chat session connected to OpenAI Realtime API');

      connection.on('close', () => {
        console.log('Browser chat client disconnected');
        // Clean up session
        this.sessions.delete(connection);
      });

      connection.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        this.sessions.delete(connection);
      });
    } catch (error) {
      console.error('Error handling browser chat stream:', error);
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
    });
  }
}