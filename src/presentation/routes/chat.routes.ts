import type { FastifyInstance } from 'fastify';
import { ChatController } from '../controllers/chat.controller.js';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerChatRoutes(
  fastify: FastifyInstance,
  controller: ChatController,
): void {
  // Serve static files from public directory
  const publicPath = path.join(__dirname, '..', 'public');
  fastify.register(fastifyStatic, {
    root: publicPath,
    prefix: '/public/',
  });

  // Serve chat interface at /chat
  fastify.get('/chat', async (request, reply) => {
    await controller.serveChatInterface(request, reply);
  });

  // Chat status endpoint
  fastify.get('/chat-status', async (request, reply) => {
    await controller.getChatStatus(request, reply);
  });

  // WebSocket endpoint for browser chat
  fastify.register(async (scopedFastify: FastifyInstance) => {
    scopedFastify.get(
      '/chat-stream',
      { websocket: true },
      async (connection: any) => {
        await controller.handleChatStream(connection);
      },
    );
  });
}

