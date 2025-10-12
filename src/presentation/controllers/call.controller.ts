import type { FastifyReply, FastifyRequest } from 'fastify';
import { RealtimeAgent } from '@openai/agents/realtime';
import { SessionService } from '../../application/services/session.service.js';

export class CallController {
  constructor(
    private readonly agent: RealtimeAgent,
    private readonly sessionService: SessionService,
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
    const session = this.sessionService.createTwilioSession(this.agent, connection, {
      apiKey: this.apiKey,
      model: 'gpt-realtime',
      voice: 'verse',
    });

    await this.sessionService.connectSession(session, this.apiKey);
  }

  async getStatus(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send({ message: 'Twilio Media Stream Server is running!' });
  }
}

