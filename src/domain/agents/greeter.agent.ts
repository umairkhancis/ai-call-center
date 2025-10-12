import { RealtimeAgent } from '@openai/agents/realtime';
import { weatherTool, secretTool } from '../tools/index.js';

export const greeterAgent = new RealtimeAgent({
  name: 'Greeter',
  instructions:
    'You are a friendly assistant. When you use a tool always first say what you are about to do.',
  tools: [
    {
      type: 'hosted_tool',
      name: 'dnd',
    },
    {
      type: 'hosted_tool',
      name: 'deepwiki',
    },
    secretTool,
    weatherTool,
  ],
});

