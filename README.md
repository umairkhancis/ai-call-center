# AI Call Center

An AI-powered call center built with OpenAI's Realtime API, featuring a browser-based chat interface and following clean architecture principles.

## Overview

This application enables real-time conversations with an AI agent through a modern web-based chat interface. It uses OpenAI's Realtime API for natural language understanding and generation, with support for multiple transport modes including browser chat and future Twilio telephony integration.

## Architecture

The project follows clean architecture with three distinct layers:

```
src/
├── config/              # Configuration layer
│   └── environment.ts   # Environment variables & transport mode management
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
│   │   └── browser-chat-session.service.ts
│   └── server.ts        # Server setup
│
├── presentation/        # Presentation layer (External interfaces)
│   ├── controllers/     # Request handlers
│   │   └── chat.controller.ts
│   ├── routes/          # Route definitions
│   │   └── chat.routes.ts
│   └── public/          # Static files for browser interface
│       ├── index.html   # Chat interface HTML
│       ├── chat.js      # Client-side chat logic
│       └── style.css    # Chat interface styling
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
- Browser chat interface
- Static file serving
- Depends on application and domain layers

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- OpenAI API key with Realtime API access
- Modern web browser with WebSocket support

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=5050
TRANSPORT_MODE=browser-chat
```

#### Transport Mode Options

- `browser-chat`: Enable browser-based chat interface (default and currently implemented)
- `twilio`: Enable Twilio voice integration (planned feature)
- `both`: Enable all transport modes (planned feature)

**Current Status**: Only `browser-chat` mode is fully implemented. The application currently focuses on providing a modern web-based chat interface.

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### GET /chat
Serves the browser chat interface
- **Response:** HTML page with chat UI
- **Features:** Real-time messaging, connection status, responsive design

### GET /chat-status
Chat service health check endpoint
- **Response:** `{ "status": "online", "message": "Browser Chat Service is running!", "transport": "browser-chat", "activeSessions": <number> }`

### WS /chat-stream
WebSocket endpoint for real-time text-based chat
- **Protocol:** JSON message format
- **Function:** Bidirectional text messaging with OpenAI Realtime API
- **Message Format:** `{ "type": "message", "content": "user message" }`

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
- **DnD Tool:** Dungeons & Dragons information and resources
- **DeepWiki Tool:** Deep Wikipedia content and knowledge access

*Note: These MCP (Model Context Protocol) tools provide hosted services accessible through the chat interface.*

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

To test the browser chat interface:

1. Start the server: `npm run dev`
2. Open your browser to: `http://localhost:5050/chat`
3. Start chatting with the AI assistant
4. Try asking about:
   - Weather: "What is the weather in London?"
   - Secret number: "What is the special number?"
   - D&D information: "Tell me about dungeons and dragons"
   - Wikipedia: "Search for information about artificial intelligence"

## Future Enhancements

- Twilio voice integration for phone calls
- Multiple agent routing
- Call/chat recording and analytics
- Enhanced MCP tool integration
- Multi-language support
- Audio support in browser (voice chat)
- Message history and persistence
- User authentication and profiles
- Multi-user chat rooms

## License

ISC

## Current Implementation Status

**✅ Implemented:**
- Browser-based chat interface with real-time messaging
- OpenAI Realtime API integration for text-based conversations  
- Agent with weather tool, secret tool, and MCP hosted tools (DnD, DeepWiki)
- Clean architecture with proper layer separation
- TypeScript implementation with modern tooling
- Static file serving for chat UI

**🚧 Planned:**
- Twilio voice call integration
- Multiple transport mode support
- Enhanced UI features and mobile responsiveness

## Documentation

- [AGENTS.md](./AGENTS.md) - Agent and tool documentation
- [ARCHIECTURE.md](./ARCHIECTURE.md) - Detailed architecture documentation  
- [BROWSER_CHAT_IMPLEMENTATION.md](./BROWSER_CHAT_IMPLEMENTATION.md) - Browser chat implementation details
- [TEXT_MODE_IMPLEMENTATION.md](./TEXT_MODE_IMPLEMENTATION.md) - Text mode technical details

