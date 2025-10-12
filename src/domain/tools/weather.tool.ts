import { tool } from '@openai/agents/realtime';
import { z } from 'zod';

export const weatherTool = tool({
  name: 'weather',
  description: 'Get the weather in a given location.',
  parameters: z.object({
    location: z.string(),
  }),
  execute: async ({ location }: { location: string }) => {
    return `The weather in ${location} is sunny.`;
  },
});

