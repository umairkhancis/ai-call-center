import type { FastifyInstance } from 'fastify';
import { CallController } from '../controllers/call.controller.js';

export function registerCallRoutes(
  fastify: FastifyInstance,
  controller: CallController,
): void {
  // Root route - Health check
  fastify.get('/', async (request, reply) => {
    await controller.getStatus(request, reply);
  });

  // Route for Twilio to handle incoming and outgoing calls
  fastify.all('/incoming-call', async (request, reply) => {
    await controller.handleIncomingCall(request, reply);
  });

  // WebSocket route for media-stream
  fastify.register(async (scopedFastify: FastifyInstance) => {
    scopedFastify.get(
      '/media-stream',
      { websocket: true },
      async (connection: any) => {
        await controller.handleMediaStream(connection);
      },
    );
  });
}