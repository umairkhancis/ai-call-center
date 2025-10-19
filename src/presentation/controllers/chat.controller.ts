import type { FastifyReply, FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { RealtimeAgent } from '@openai/agents/realtime';
import { BrowserChatSessionService } from '../../application/services/browser-chat-session.service.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export class ChatController {
  // Store browser chat sessions per connection
  private sessions: Map<WebSocket, BrowserChatSessionService> = new Map();

  constructor(
    private readonly agent: RealtimeAgent,
    private readonly apiKey: string,
  ) {}

  /**
   * Handle browser chat WebSocket connections
   * Connects to OpenAI Realtime API
   */
  async handleChatStream(webSocket: WebSocket): Promise<void> {
    console.log('[ChatController] Browser chat client connected');

    try {
      // Create a combined browser chat session service
      const sessionService = new BrowserChatSessionService(webSocket);

      // Store session service for this connection
      this.sessions.set(webSocket, sessionService);
      console.log('[ChatController] Session created, active sessions:', this.sessions.size);

      // Create and connect session to OpenAI Realtime API
      await sessionService.createAndConnectSession(this.agent, {
        apiKey: this.apiKey,
        model: 'gpt-realtime',
      });

      console.log('[ChatController] Connected to OpenAI Realtime API');

      // Send initial connection confirmation
      webSocket.send(JSON.stringify({ type: 'connected' }));

      // Handle connection close
      webSocket.on('close', () => {
        console.log('[ChatController] Browser chat client disconnected');
        // Clean up session
        const sessionService = this.sessions.get(webSocket);
        if (sessionService) {
          sessionService.close();
        }
        this.sessions.delete(webSocket);
        console.log('[ChatController] Session cleaned up, active sessions:', this.sessions.size);
      });

      webSocket.on('error', (error: Error) => {
        console.error('[ChatController] WebSocket error:', error);
        // Clean up session on error
        const sessionService = this.sessions.get(webSocket);
        if (sessionService) {
          sessionService.close();
        }
        this.sessions.delete(webSocket);
      });
    } catch (error) {
      console.error('[ChatController] Error handling browser chat stream:', error);
      // Clean up on error
      const sessionService = this.sessions.get(webSocket);
      if (sessionService) {
        sessionService.close();
      }
      this.sessions.delete(webSocket);
      webSocket.close();
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