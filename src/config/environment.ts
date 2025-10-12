import dotenv from 'dotenv';
import process from 'node:process';

// Load environment variables from .env file
dotenv.config();

export type TransportMode = 'twilio' | 'browser-chat' | 'both';

export interface EnvironmentConfig {
  openaiApiKey: string;
  port: number;
  transportMode: TransportMode;
  enableTwilio: boolean;
  enableBrowserChat: boolean;
}

export function loadEnvironment(): EnvironmentConfig {
  const { OPENAI_API_KEY, PORT, TRANSPORT_MODE } = process.env;

  if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API key. Please set it in the .env file.');
    process.exit(1);
  }

  const transportMode = (TRANSPORT_MODE as TransportMode) || 'both';

  // Validate transport mode
  if (!['twilio', 'browser-chat', 'both'].includes(transportMode)) {
    console.error(
      `Invalid TRANSPORT_MODE: ${transportMode}. Must be 'twilio', 'browser-chat', or 'both'.`,
    );
    process.exit(1);
  }

  const config = {
    openaiApiKey: OPENAI_API_KEY,
    port: +(PORT || 5050),
    transportMode,
    enableTwilio: transportMode === 'twilio' || transportMode === 'both',
    enableBrowserChat: transportMode === 'browser-chat' || transportMode === 'both',
  } as EnvironmentConfig;

  console.log(`Environment config: ${JSON.stringify(config)}`);

  return config;
}

