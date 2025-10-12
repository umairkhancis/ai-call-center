import { loadEnvironment } from './config/environment.js';
import { greeterAgent } from './domain/agents/index.js';
import { Server } from './application/server.js';
import { SessionService } from './application/services/session.service.js';
import { CallController } from './presentation/controllers/call.controller.js';
import { registerCallRoutes } from './presentation/routes/call.routes.js';

async function bootstrap(): Promise<void> {
  // Load environment configuration
  const config = loadEnvironment();

  // Initialize Application Layer
  const server = new Server(config.port);
  const sessionService = new SessionService();

  // Initialize Presentation Layer
  const callController = new CallController(
    greeterAgent,
    sessionService,
    config.openaiApiKey,
  );

  // Register routes
  registerCallRoutes(server.getInstance(), callController);

  // Start server
  await server.start();
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

