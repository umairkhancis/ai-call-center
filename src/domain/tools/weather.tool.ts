import { tool } from '@openai/agents/realtime';
import { z } from 'zod';

export const weatherTool = tool({
  name: 'weather',
  description: 'Get the weather in a given location.',
  parameters: z.object({
    location: z.string(),
  }) as any,
  execute: async (input: any) => {
    return `The weather in ${input.location} is sunny.`;
  },
});

