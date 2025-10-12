import dotenv from 'dotenv';
import process from 'node:process';

// Load environment variables from .env file
dotenv.config();

export interface EnvironmentConfig {
  openaiApiKey: string;
  port: number;
}

export function loadEnvironment(): EnvironmentConfig {
  const { OPENAI_API_KEY, PORT } = process.env;

  if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API key. Please set it in the .env file.');
    process.exit(1);
  }

  return {
    openaiApiKey: OPENAI_API_KEY,
    port: +(PORT || 5050),
  };
}

