// Configuration management for simple setup

import { CommunicationConfig, ServerConfig } from './types';

export const DEFAULT_CONFIG = {
  websocket: {
    serverUrl: 'ws://localhost:8080',
    port: 8080,
    reconnectInterval: 5000,
    maxReconnectAttempts: 3 // Keep simple
  },
  webrtc: {
    // Future - keep minimal for now
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
} as const;

export function createClientConfig(): CommunicationConfig {
  const config: CommunicationConfig = {
    type: 'websocket',
    serverUrl: DEFAULT_CONFIG.websocket.serverUrl,
    reconnectInterval: DEFAULT_CONFIG.websocket.reconnectInterval,
    maxReconnectAttempts: DEFAULT_CONFIG.websocket.maxReconnectAttempts
  };

  console.debug('[CONFIG] Created client config:', config);
  return config;
}

export function createServerConfig(): ServerConfig {
  const config: ServerConfig = {
    protocol: 'websocket',
    port: DEFAULT_CONFIG.websocket.port
  };

  console.debug('[CONFIG] Created server config:', config);
  return config;
}