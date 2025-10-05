// Shared types and interfaces for WebSocket to WebRTC communication

export interface MessagePayload {
  [key: string]: any;
}

export interface Message {
  id: string;
  type: MessageType;
  timestamp: number;
  sender: string;
  recipient: string;
  payload: MessagePayload;
  metadata?: Record<string, any>;
}

export enum MessageType {
  HANDSHAKE = 'handshake',
  DATA = 'data',
  COMMAND = 'command',
  STATUS = 'status',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

export interface CommunicationConfig {
  type: 'websocket' | 'webrtc';
  serverUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface ClientInfo {
  id: string;
  connection: any;
  ip?: string;
  connectedAt: Date;
}

export interface ServerConfig {
  protocol: 'websocket' | 'webrtc';
  port: number;
  heartbeatInterval?: number;
}

// Logger interface for verbose debugging
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Simple console logger implementation
export class ConsoleLogger implements Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  debug(message: string, ...args: any[]): void {
    console.debug(`${this.prefix}DEBUG: ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(`${this.prefix}INFO: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix}WARN: ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`${this.prefix}ERROR: ${message}`, ...args);
  }
}

// Helper function to create type-safe messages
export const createMessage = (
  type: MessageType,
  payload: MessagePayload,
  sender: string,
  recipient: string = 'server'
): Message => {
  const message: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    sender,
    recipient,
    payload,
    metadata: {}
  };

  console.debug('[MESSAGE_FACTORY] Created message:', {
    id: message.id,
    type: message.type,
    sender: message.sender,
    recipient: message.recipient,
    payloadKeys: Object.keys(message.payload)
  });

  return message;
};