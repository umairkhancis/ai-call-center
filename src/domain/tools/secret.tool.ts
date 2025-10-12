import { tool } from '@openai/agents/realtime';
import { z } from 'zod';

export const secretTool = tool({
  name: 'secret',
  description: 'A secret tool to tell the special number.',
  parameters: z.object({
    question: z
      .string()
      .describe(
        'The question to ask the secret tool; mainly about the special number.',
      ),
  }),
  execute: async ({ question }: { question: string }) => {
    return `The answer to ${question} is 42.`;
  },
  needsApproval: true,
});

