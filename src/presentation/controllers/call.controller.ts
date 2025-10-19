import type { FastifyReply, FastifyRequest } from 'fastify';
import { RealtimeAgent } from '@openai/agents/realtime';
import { CallChatSessionService } from '../../application/services/call-chat-session.service.js';


export class CallController {
  constructor(
    private readonly agent: RealtimeAgent,
    private readonly sessionService: CallChatSessionService,
    private readonly apiKey: string,
  ) {}

  async handleIncomingCall(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const twimlResponse = `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>O.K. you can start talking!</Say>
    <Connect>
        <Stream url="wss://${request.headers.host}/media-stream" />
    </Connect>
</Response>`.trim();

    reply.type('text/xml').send(twimlResponse);
  }

  async handleMediaStream(connection: any): Promise<void> {
    try {
      console.log('[CallController] New Twilio media stream connection');
      
      // Create a new session using the session service
      const session = this.sessionService.createTwilioSession(this.agent, connection, {
        apiKey: this.apiKey,
        model: 'gpt-realtime',
        voice: 'verse',
      });

      // Connect the session to OpenAI
      await this.sessionService.connectSession(session, this.apiKey);

      console.log('[CallController] Twilio session connected successfully');
      
      // Handle connection cleanup
      connection.on('close', () => {
        console.log('[CallController] Twilio connection closed, cleaning up session');
        // The transport layer will handle cleanup automatically
      });

    } catch (error) {
      console.error('[CallController] Failed to handle media stream:', error);
      connection.close();
    }
  }

  async getStatus(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send({ message: 'Twilio Media Stream Server is running!' });
  }
}