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
   * Uses dummy implementation (no API calls)
   */
  async handleChatStream(connection: WebSocket): Promise<void> {
    console.log('Browser chat client connected (dummy mode)');

    try {
      // Send initial connection confirmation
      connection.send(JSON.stringify({ type: 'connected' }));

      connection.on('message', async (data: Buffer) => {
        try {
          const message: ChatMessage = JSON.parse(data.toString());
          
          if (message.type === 'ping') {
            connection.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          if (message.type === 'message' && message.content) {
            console.log(`Received message: ${message.content}`);
            
            // Generate dummy response
            const response = this.generateDummyAgentResponse(message.content);
            
            // Send response back to browser
            connection.send(JSON.stringify({
              type: 'assistant.message',
              text: response,
            }));
            
            connection.send(JSON.stringify({ type: 'response.done' }));
          }
        } catch (error) {
          console.error('Error processing message:', error);
          connection.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message',
          }));
        }
      });

      connection.on('close', () => {
        console.log('Browser chat client disconnected');
      });

      connection.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('Error handling browser chat stream:', error);
      connection.close();
    }
  }

  /**
   * Generate dummy agent response without API calls
   * Simple keyword-based responses for testing
   */
  private generateDummyAgentResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for weather tool invocation
    if (lowerMessage.includes('weather')) {
      const locationMatch = userMessage.match(/weather\s+(?:in\s+)?([a-zA-Z\s]+)/i);
      const location = locationMatch ? locationMatch[1].trim() : 'your location';
      return `The weather in ${location} is sunny.`;
    }
    
    // Check for secret tool invocation
    if (lowerMessage.includes('secret') || lowerMessage.includes('special number')) {
      return `The answer is 42.`;
    }
    
    // Default response
    return `I received your message: "${userMessage}". I'm a friendly assistant powered by AI. You can ask me about the weather or the special number!`;
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