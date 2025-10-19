import { loadEnvironment } from './config/environment.js';
import { greeterAgent } from './domain/agents/index.js';
import { Server } from './application/server.js';
import { ChatController } from './presentation/controllers/chat.controller.js';
import { CallController } from './presentation/controllers/call.controller.js';
import { CallChatSessionService } from './application/services/call-chat-session.service.js';
import { registerChatRoutes } from './presentation/routes/chat.routes.js';
import { registerCallRoutes } from './presentation/routes/call.routes.js';

async function bootstrap(): Promise<void> {
  // Load environment configuration
  const config = loadEnvironment();

  console.log(`Starting AI Call Center in ${config.transportMode} mode...`);

  // Initialize Application Layer
  const server = new Server(config.port);

  const availableEndpoints: string[] = [];

  // Set up browser chat if enabled
  if (config.enableBrowserChat) {
    const chatController = new ChatController(
      greeterAgent,
      config.openaiApiKey,
    );
    registerChatRoutes(server.getInstance(), chatController);
    availableEndpoints.push('/chat');
  }

  // Set up Twilio call handling if enabled
  if (config.enableTwilio) {
    const callSessionService = new CallChatSessionService();
    const callController = new CallController(
      greeterAgent,
      callSessionService,
      config.openaiApiKey,
    );
    registerCallRoutes(server.getInstance(), callController);
    availableEndpoints.push('/incoming-call', '/media-stream');
  }

  // Start server
  await server.start();

  console.log(`\nAvailable endpoints: ${availableEndpoints.join(', ')}`);
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

