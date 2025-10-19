import { loadEnvironment } from './config/environment.js';
import { greeterAgent } from './domain/agents/index.js';
import { Server } from './application/server.js';
import { SessionService } from './application/services/session.service.js';
import { ChatController } from './presentation/controllers/chat.controller.js';
import { registerChatRoutes } from './presentation/routes/chat.routes.js';

async function bootstrap(): Promise<void> {
  // Load environment configuration
  const config = loadEnvironment();

  console.log(`Starting AI Call Center in ${config.transportMode} mode...`);

  // Initialize Application Layer
  const server = new Server(config.port);

  // Responsible for creating and managing sessions
  const sessionService = new SessionService();

  // Responsible for handling chat requests
  const chatController = new ChatController(
    greeterAgent,
    sessionService,
    config.openaiApiKey,
  );
  registerChatRoutes(server.getInstance(), chatController);

  // Start server
  await server.start();

  console.log('\nAvailable endpoints: /chat');
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

