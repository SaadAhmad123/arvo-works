import z from 'zod';
import { cleanString } from 'arvo-core';

export const baseAgentInputSchema = {
  email: z.string().describe(cleanString(`
    The email which the agent can use to interact/ read with the kanban card
    directly
  `)),
  cardId: z.string().describe(cleanString(`
    The unique identifier of the Kanban card containing the task to execute.
  `)),
} as const;

export const artefactContractSchema = z.object({
  id: z.string().describe('Artefact ID for retrieval'),
  description: z.string().describe(
    'Brief summary of artefact contents. No more than one sentence',
  ),
}).array();
