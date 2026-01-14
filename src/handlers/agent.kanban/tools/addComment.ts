import { createAgentTool } from '@arvo-tools/agentic';
import { cleanString } from 'arvo-core';
import z from 'zod';
import { board } from '../../../kanban/config.ts';

export const addComment = createAgentTool({
  name: 'tool.add.comment.kandban.card',
  description: cleanString(`
    Posts a comment message to a Kanban card on behalf 
    of the autonomous agent to communicate progress, 
    ask clarifying questions, or provide updates
  `),
  input: z.object({
    id: z.string().describe(cleanString(`
      Unique identifier of the Kanban card where the 
      comment will be posted
    `)),
    comment: z.string().describe(cleanString(`
      The message content that the agent wants to add 
      to the card's conversation thread
    `)),
  }),
  output: z.object({
    result: z.boolean().describe(cleanString(`
      Confirmation flag indicating whether the comment 
      was successfully posted to the Kanban card
    `)),
  }),
  fn: async ({ id, comment }) => {
    await board.comment(id, comment);
    return { result: true };
  },
});
