# AI Call Center

An AI-powered call center built with OpenAI's Realtime API, supporting both browser-based chat and Twilio voice calls, following clean architecture principles.

## Overview

This application enables real-time conversations with an AI agent through multiple interfaces:
- **Browser Chat**: Modern web-based text chat interface
- **Twilio Voice**: Traditional phone call integration

It uses OpenAI's Realtime API for natural language understanding and generation, with configurable transport modes that can be enabled independently or simultaneously.

## System Architecture Overview

<img width="588" height="727" alt="Screenshot 2025-10-20 at 01 18 09" src="https://github.com/user-attachments/assets/d15720cb-e14e-47c1-860b-3b99b7779c2c" />

## System Architecture High Level Design
<img width="529" height="699" alt="Screenshot 2025-10-20 at 01 37 00" src="https://github.com/user-attachments/assets/f12e49ff-0b64-4c50-8f96-ebb46ead273a" />


## Twilio Voice Call Flow

<img width="890" height="622" alt="Screenshot 2025-10-20 at 01 21 15" src="https://github.com/user-attachments/assets/7dc374c6-03ed-4e15-bf9f-029b08beb4bc" />

## Browser Chat Flow

<img width="892" height="633" alt="Screenshot 2025-10-20 at 01 22 27" src="https://github.com/user-attachments/assets/0a03160e-8d71-465c-b7ad-32f9ae5d5059" />



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
│   │   ├── browser-chat-session.service.ts
│   │   └── call-chat-session.service.ts
│   └── server.ts        # Server setup
│
├── presentation/        # Presentation layer (External interfaces)
│   ├── controllers/     # Request handlers
│   │   ├── chat.controller.ts
│   │   └── call.controller.ts
│   ├── routes/          # Route definitions
│   │   ├── chat.routes.ts
│   │   └── call.routes.ts
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
- Twilio voice call integration
- Static file serving
- Depends on application and domain layers

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- OpenAI API key with Realtime API access
- Modern web browser with WebSocket support (for browser chat)
- Twilio account with phone number (for voice calls, optional)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=5050
TRANSPORT_MODE=both
```

#### Transport Mode Options

- `browser-chat`: Enable browser-based chat interface only
- `twilio`: Enable Twilio voice integration only  
- `both`: Enable all transport modes simultaneously (default)

**Current Status**: Both transport modes are fully implemented and can be used independently or together.

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Browser Chat Endpoints

#### GET /chat
Serves the browser chat interface
- **Response:** HTML page with chat UI
- **Features:** Real-time messaging, connection status, responsive design

#### GET /chat-status
Chat service health check endpoint
- **Response:** `{ "status": "online", "message": "Browser Chat Service is running!", "transport": "browser-chat", "activeSessions": <number> }`

#### WS /chat-stream
WebSocket endpoint for real-time text-based chat
- **Protocol:** JSON message format
- **Function:** Bidirectional text messaging with OpenAI Realtime API
- **Message Format:** `{ "type": "message", "content": "user message" }`

### Twilio Voice Endpoints

#### GET /
Health check endpoint
- **Response:** `{ "message": "Twilio Media Stream Server is running!" }`

#### POST /incoming-call
Twilio webhook endpoint for incoming calls
- **Returns:** TwiML response with WebSocket URL
- **Function:** Establishes voice connection and starts conversation

#### WS /media-stream
WebSocket endpoint for real-time audio streaming
- **Protocol:** Twilio Media Stream
- **Function:** Bidirectional audio streaming with OpenAI Realtime API
- **Audio Format:** Base64-encoded PCM audio

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

### Browser Chat Testing

1. Start the server: `npm run dev`
2. Open your browser to: `http://localhost:5050/chat`
3. Start chatting with the AI assistant
4. Try asking about:
   - Weather: "What is the weather in London?"
   - Secret number: "What is the special number?"
   - D&D information: "Tell me about dungeons and dragons"
   - Wikipedia: "Search for information about artificial intelligence"

### Twilio Voice Testing

1. Start the server: `npm run dev`
2. Use ngrok to expose localhost: `ngrok http 5050`
3. Configure Twilio webhook to point to: `https://your-ngrok-url/incoming-call`
4. Call your Twilio phone number
5. Start talking after the greeting
6. Ask the same questions as above via voice

## Future Enhancements

- Multiple agent routing
- Call/chat recording and analytics
- Enhanced MCP tool integration
- Multi-language support
- Audio support in browser (voice chat)
- Message history and persistence
- User authentication and profiles
- Multi-user chat rooms
- SMS integration
- Slack bot integration

## License

ISC

## Current Implementation Status

**✅ Fully Implemented:**
- **Browser Chat Interface**: Real-time text messaging with modern web UI
- **Twilio Voice Integration**: Phone call handling with audio streaming
- **Dual Transport Support**: Both modes can run independently or simultaneously
- **OpenAI Realtime API**: Integration for both text and audio conversations
- **Agent with Tools**: Weather tool, secret tool, and MCP hosted tools (DnD, DeepWiki)
- **Clean Architecture**: Proper layer separation with transport-agnostic design
- **TypeScript Implementation**: Full type safety and modern tooling
- **Session Management**: Independent session handling per connection
- **Configurable Modes**: Environment-based transport mode selection

**🚧 Planned Enhancements:**
- Enhanced UI features and mobile responsiveness
- Advanced session management and analytics
- Additional transport integrations (SMS, Slack, etc.)

