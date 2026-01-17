import { createAgentTool } from '@arvo-tools/agentic';
import { cleanString } from 'arvo-core';
import z from 'zod';
import {
  artefactContractSchema,
  baseAgentInputSchema,
} from '../schemas/base.ts';
import { getBoard } from '../../../config.ts';

export const readCard = () =>
  createAgentTool({
    name: 'tool.read.kandban.card',
    description: cleanString(`
      Retrieves comprehensive information about a specific 
      Kanban card including its title, description, and available
      artefacts. You this to explore more information in the
      card. Use it only when needed
    `),
    input: z.object({
      ...baseAgentInputSchema,
    }),
    output: z.object({
      title: z.string().describe(cleanString(`
        The headline or name of the Kanban card
      `)),
      description: z.string().describe(cleanString(`
        Detailed explanation of the task or request 
        contained in the Kanban card
      `)),
      artefacts: artefactContractSchema.describe(cleanString(`
        A list of all available artefacts in the card  
      `)),
    }),
    fn: async ({ cardId, email }) => {
      const { card, artefacts } = await getBoard({ botEmail: email }).get(
        cardId,
      );
      return {
        title: card?.Title ?? '',
        description: card?.Description ?? '',
        artefacts: artefacts.map((item) => ({
          id: item.id.toString(),
          description: item.fields?.Title ?? 'Unknow',
        })),
      };
    },
  });
