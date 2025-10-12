import { loadEnvironment } from './config/environment.js';
import { greeterAgent } from './domain/agents/index.js';
import { Server } from './application/server.js';
import { SessionService } from './application/services/session.service.js';
import { CallController } from './presentation/controllers/call.controller.js';
import { ChatController } from './presentation/controllers/chat.controller.js';
import { registerCallRoutes } from './presentation/routes/call.routes.js';
import { registerChatRoutes } from './presentation/routes/chat.routes.js';

async function bootstrap(): Promise<void> {
  // Load environment configuration
  const config = loadEnvironment();

  console.log(`Starting AI Call Center in ${config.transportMode} mode...`);

  // Initialize Application Layer
  const server = new Server(config.port);
  const sessionService = new SessionService();

  // Conditionally register Twilio routes
  if (config.enableTwilio) {
    console.log('✓ Enabling Twilio voice interface');
    const callController = new CallController(
      greeterAgent,
      sessionService,
      config.openaiApiKey,
    );
    registerCallRoutes(server.getInstance(), callController);
  }

  // Conditionally register Browser Chat routes
  if (config.enableBrowserChat) {
    console.log('✓ Enabling Browser Chat interface');
    const chatController = new ChatController(
      greeterAgent,
      sessionService,
      config.openaiApiKey,
    );
    registerChatRoutes(server.getInstance(), chatController);
  }

  // Validate at least one transport is enabled
  if (!config.enableTwilio && !config.enableBrowserChat) {
    console.error('Error: No transport layer enabled. Please configure TRANSPORT_MODE.');
    process.exit(1);
  }

  // Start server
  await server.start();
  
  console.log('\nAvailable endpoints:');
  if (config.enableTwilio) {
    console.log('  - Twilio: /incoming-call, /media-stream');
  }
  if (config.enableBrowserChat) {
    console.log('  - Browser Chat: /chat, /chat-stream');
  }
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

