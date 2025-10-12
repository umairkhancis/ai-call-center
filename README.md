# AI Call Center

An AI-powered call center built with OpenAI's Realtime API and Twilio, following clean architecture principles.

## Overview

This application enables real-time voice conversations with an AI agent through phone calls. It uses OpenAI's Realtime API for natural language understanding and generation, integrated with Twilio for telephony.

## Architecture

The project follows clean architecture with three distinct layers:

```
src/
├── config/              # Configuration layer
│   └── environment.ts   # Environment variables management
│
├── domain/              # Domain layer (Inner layer - no external dependencies)
│   ├── agents/          # AI agent definitions
│   │   ├── greeter.agent.ts
│   │   └── index.ts
│   └── tools/           # Business logic tools
│       ├── weather.tool.ts
│       ├── secret.tool.ts
│       └── index.ts
│
├── application/         # Application layer (Orchestration)
│   ├── services/        # Business services
│   │   └── session.service.ts
│   └── server.ts        # Server setup
│
├── presentation/        # Presentation layer (External interfaces)
│   ├── controllers/     # Request handlers
│   │   └── call.controller.ts
│   └── routes/          # Route definitions
│       └── call.routes.ts
│
└── index.ts            # Application entry point
```

### Layer Responsibilities

**Domain Layer (Inner):**
- Agent definitions and behavior
- Tool implementations
- Business logic
- No dependencies on outer layers

**Application Layer (Middle):**
- Session management and orchestration
- Server configuration
- Service coordination
- Depends only on domain layer

**Presentation Layer (Outer):**
- HTTP/WebSocket endpoints
- Request/response handling
- Twilio integration
- Depends on application and domain layers

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- OpenAI API key with Realtime API access
- Twilio account (for phone integration)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=5050
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### GET /
Health check endpoint
- **Response:** `{ "message": "Twilio Media Stream Server is running!" }`

### POST /incoming-call
Twilio webhook endpoint for incoming calls
- **Returns:** TwiML response with WebSocket URL

### WS /media-stream
WebSocket endpoint for real-time audio streaming
- **Protocol:** Twilio Media Stream
- **Function:** Bidirectional audio streaming with OpenAI Realtime API

## Available Tools

The AI agent has access to the following tools:

### Weather Tool
Get weather information for a location
- **Name:** `weather`
- **Parameter:** `location` (string)
- **Approval:** Not required

### Secret Tool
Ask about the special number (returns 42)
- **Name:** `secret`
- **Parameter:** `question` (string)
- **Approval:** Required

### MCP Hosted Tools
- **DnD Tool:** Dungeons & Dragons information
- **DeepWiki Tool:** Deep Wikipedia access

## Architecture Principles

### Clean Architecture
- Inner layers are independent of outer layers
- Outer layers depend on inner layers
- Business logic isolated from frameworks

### SOLID Principles
- **Single Responsibility:** Each class has one reason to change
- **Open/Closed:** Open for extension, closed for modification
- **Liskov Substitution:** Transport layers are interchangeable
- **Interface Segregation:** Clean, focused interfaces
- **Dependency Inversion:** High-level logic doesn't depend on low-level details

### Additional Principles
- **DRY:** Don't Repeat Yourself - reusable components
- **YAGNI:** You Aren't Gonna Need It - implement only what's needed

## Development

### Project Structure

Each layer is self-contained with clear responsibilities:

1. **Config**: Environment and configuration management
2. **Domain**: Core business logic and entities
3. **Application**: Services and orchestration
4. **Presentation**: External interfaces and controllers

### Adding New Tools

1. Create tool file in `src/domain/tools/`
2. Export from `src/domain/tools/index.ts`
3. Add to agent in `src/domain/agents/greeter.agent.ts`

### Adding New Agents

1. Create agent file in `src/domain/agents/`
2. Export from `src/domain/agents/index.ts`
3. Wire up in `src/index.ts`

## Testing

To test the application:

1. Start the server: `npm run dev`
2. Use ngrok or similar to expose localhost: `ngrok http 5050`
3. Configure Twilio webhook to point to: `https://your-ngrok-url/incoming-call`
4. Call your Twilio number

## Future Enhancements

- Browser-based chat interface
- Multiple agent routing
- Call recording and analytics
- Enhanced MCP tool integration
- Multi-language support

## License

ISC

## Documentation

- [AGENTS.md](./AGENTS.md) - Agent and tool documentation
- [ARCHIECTURE.md](./ARCHIECTURE.md) - Detailed architecture documentation

