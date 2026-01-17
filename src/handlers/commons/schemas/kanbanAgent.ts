import { createArvoOrchestratorContract } from 'arvo-core';
import { cleanString } from 'arvo-core';
import z from 'zod';
import { artefactContractSchema, baseAgentInputSchema } from './base.ts';

// This function create the contract for agents which
// interact directly with the kanban board and get instructions
// directly from the board cards
export const createKanbanAgentContract = <
  TUri extends string,
  TName extends string,
>(param: {
  uri: TUri;
  name: TName;
  description: string;
}) =>
  createArvoOrchestratorContract({
    uri: param.uri,
    name: param.name,
    description: param.description,
    versions: {
      '1.0.0': {
        init: z.object({
          ...baseAgentInputSchema,
          body: z.string().describe(cleanString(`
            The task description including title, details, and any relevant 
            information from the card body.
          `)),
          artefacts: artefactContractSchema.describe(cleanString(`
            Existing artefacts on this card from prior work by agents or humans.
            Use the read artefact tool with the ID to access contents.
          `)),
          comments: z.object({
            role: z.enum(['user', 'assistant']),
            message: z.string(),
          }).array().describe(cleanString(`
            Conversation history between human and AI on this card.
          `)),
        }),
        complete: z.object({
          cardId: z.string().describe(cleanString(`
            The identifier of the processed Kanban card.
          `)),
          response: z.discriminatedUnion('status', [
            z.object({
              status: z.literal('DONE').describe(cleanString(`
                Indicates the task has been completed successfully.
              `)),
              summary: z.string().describe(cleanString(`
                A brief explanation of what was accomplished and why it matters.
              `)),
              deliverable: z.string().describe(cleanString(`
                The actual work product or output produced by completing the task.
              `)),
              rationale: z.string().optional().describe(cleanString(`
                Explanation of the approach taken and reasoning behind the result.
              `)),
            }),
            z.object({
              status: z.literal('INPROGRESS').describe(cleanString(`
                Indicates the task is ongoing and requires further interaction.
              `)),
              deliverable: z.string().optional().describe(cleanString(`
                Any interim work product or output produced so far.
              `)),
              message: z.string().optional().default('Acknowledged').describe(
                cleanString(`
                  Communication to the user while the task remains incomplete.
                `),
              ),
            }),
          ]).describe(cleanString(`
            The outcome of task execution indicating completion or ongoing status.
          `)),
        }),
      },
    },
  });
