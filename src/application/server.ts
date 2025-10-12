import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';
import process from 'node:process';

export class Server {
  private fastify: FastifyInstance;
  private port: number;

  constructor(port: number) {
    this.fastify = Fastify();
    this.port = port;
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.fastify.register(fastifyFormBody);
    this.fastify.register(fastifyWs);
  }

  getInstance(): FastifyInstance {
    return this.fastify;
  }

  async start(): Promise<void> {
    await this.fastify.listen({ port: this.port }, (err: Error | null) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server is listening on port ${this.port}`);
    });

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    process.on('SIGINT', () => {
      this.fastify.close();
      process.exit(0);
    });
  }
}

