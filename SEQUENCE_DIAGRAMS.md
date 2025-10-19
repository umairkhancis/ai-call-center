# AI Call Center - Sequence Diagrams (Simplified)

This document contains simplified Mermaid sequence diagrams showing the core interactions in the AI Call Center application.

## Browser Chat Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant Agent as AI Agent
    participant OpenAI
    participant Tools

    Note over User, Tools: Browser Chat Flow

    %% Connect
    User->>Browser: Open /chat
    Browser->>Server: WebSocket connect
    Server->>OpenAI: Connect (text mode)

    %% User Message
    User->>Browser: Type: "What's the weather in London?"
    Browser->>Server: Send message
    Server->>OpenAI: Forward message
    
    %% Agent Response & Tool Usage
    OpenAI->>Agent: Process message
    Agent->>OpenAI: "I'm going to check the weather"
    OpenAI->>Server: Send response
    Server->>Browser: Forward response
    Browser->>User: Display agent message

    %% Tool Execution
    Agent->>Tools: Execute weather tool
    Tools-->>Agent: Return weather data
    Agent->>OpenAI: Weather response
    OpenAI->>Server: Final response
    Server->>Browser: Weather info
    Browser->>User: Display weather
```

## Twilio Voice Call Flow

```mermaid
sequenceDiagram
    participant User
    participant Twilio
    participant Server
    participant Agent as AI Agent
    participant OpenAI
    participant Tools

    Note over User, Tools: Voice Call Flow

    %% Call Setup
    User->>Twilio: Call phone number
    Twilio->>Server: Webhook /incoming-call
    Server->>Twilio: Return TwiML + greeting
    Twilio->>Server: WebSocket connect /media-stream
    Server->>OpenAI: Connect (audio mode)

    %% User Speech
    User->>Twilio: Speak: "What's the weather in London?"
    Twilio->>Server: Audio stream
    Server->>OpenAI: Forward audio
    
    %% Agent Response & Tool Usage
    OpenAI->>Agent: Process speech
    Agent->>OpenAI: "I'm going to check the weather"
    OpenAI->>Server: Audio response
    Server->>Twilio: Forward audio
    Twilio->>User: Play agent voice

    %% Tool Execution  
    Agent->>Tools: Execute weather tool
    Tools-->>Agent: Return weather data
    Agent->>OpenAI: Weather response
    OpenAI->>Server: Final audio response
    Server->>Twilio: Weather audio
    Twilio->>User: Play weather info
```

## System Architecture Overview

```mermaid
graph TB
    subgraph "Input Channels"
        Browser[Browser Chat<br/>Text Input]
        Phone[Phone Call<br/>Voice Input]
    end
    
    subgraph "Core System"
        Server[AI Call Center<br/>Server]
        Agent[Greeter Agent<br/>Same Logic]
        OpenAI[OpenAI<br/>Realtime API]
        Tools[Tools<br/>Weather, Secret, MCP]
    end
    
    Browser -->|WebSocket<br/>JSON| Server
    Phone -->|Twilio<br/>Audio| Server
    Server --> Agent
    Agent --> OpenAI
    Agent --> Tools
    
    style Agent fill:#e1f5fe
    style Tools fill:#e8f5e8
```

## Core Tool Flow

```mermaid
sequenceDiagram
    participant User
    participant Agent
    participant Tools

    Note over User, Tools: Same Tool Flow for Both Transports

    User->>Agent: Ask question
    Agent->>User: "I'm going to use [tool name]"
    Agent->>Tools: Execute tool
    Tools-->>Agent: Return result
    Agent->>User: Provide answer with tool data
```

## Key Points

- **Same Agent Logic**: Both browser and phone use identical AI agent and tools
- **Different I/O**: Browser uses text messages, phone uses voice audio
- **Real-time**: Both provide instant responses via OpenAI Realtime API
- **Independent Sessions**: Each connection gets its own isolated session
- **Tool Announcements**: Agent always announces before using tools
