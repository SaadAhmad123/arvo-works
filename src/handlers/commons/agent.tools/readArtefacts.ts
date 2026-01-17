import { createAgentTool } from '@arvo-tools/agentic';
import { cleanString } from 'arvo-core';
import z from 'zod';
import { baseAgentInputSchema } from '../schemas/base.ts';
import { getBoard } from '../../../config.ts';

export const readArtefact = () =>
  createAgentTool({
    name: 'tool.read.kandban.artefacts',
    description: cleanString(`
      Retrieve the contents of an artefacts by ID. Use this to access work products
      created by other agents, humans, or previous interactions on the card.
    `),
    input: z.object({
      email: baseAgentInputSchema.email,
      ids: z.string().array().describe('The artefact IDs to retrieve'),
    }),
    output: z.object({
      artefacts: z.object({
        id: z.string().describe('The artefact ID'),
        title: z.string().describe('Title of the artefact'),
        description: z.string().nullable().describe(
          'Metadata: creator, file type, or context',
        ),
        content: z.string().describe('The stored data—code, text, JSON, etc.'),
      }).array().describe('The fetched artefacts'),
    }),
    fn: async ({ ids, email }) => {
      const resps = await Promise.all(
        ids.map((id) => getBoard({ botEmail: email }).getArtefact(id)),
      );
      return {
        artefacts: resps.map((resp) => ({
          id: resp.id.toString(),
          title: resp.fields?.Title ?? 'No Title',
          description: resp.fields?.['Additional Details'] ?? null,
          content: resp.fields?.Content ?? 'Empty Artefact',
        })),
      };
    },
  });
