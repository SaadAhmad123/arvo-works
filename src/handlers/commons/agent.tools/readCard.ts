import { createAgentTool } from '@arvo-tools/agentic';
import { cleanString } from 'arvo-core';
import z from 'zod';
import { board } from '../../../kanban/config.ts';

export const readCard = () =>
  createAgentTool({
    name: 'tool.read.kandban.card',
    description: cleanString(`
    Retrieves comprehensive information about a specific 
    Kanban card including its title, description, and 
    complete conversation history with role attribution
  `),
    input: z.object({
      id: z.string().describe(cleanString(`
      Unique identifier of the Kanban card to retrieve 
      from the board
    `)),
    }),
    output: z.object({
      title: z.string().describe(cleanString(`
      The headline or name of the Kanban card
    `)),
      description: z.string().describe(cleanString(`
      Detailed explanation of the task or request 
      contained in the Kanban card
    `)),
      comments: z.object({
        role: z.enum(['user', 'agent']).describe(cleanString(`
        Author type indicating whether the comment was 
        written by a human user or the autonomous agent
      `)),
        content: z.string().describe(cleanString(`
        The actual text content of the comment message
      `)),
      }).array().describe(cleanString(`
      Chronological conversation thread containing all 
      comments exchanged between users and the agent on 
      this card
    `)),
    }),
    fn: async ({ id }) => {
      const { card, comments } = await board.get(id);
      return {
        title: card?.Title ?? '',
        description: card?.Description ?? '',
        comments: comments.filter((comment) =>
          comment?.created_by_email && comment?.comment
        ).map((comment) => ({
          role: comment.created_by_email?.includes('@bot.com')
            ? ('agent' as const)
            : ('user' as const),
          content: comment.comment ?? '',
        })),
      };
    },
  });
