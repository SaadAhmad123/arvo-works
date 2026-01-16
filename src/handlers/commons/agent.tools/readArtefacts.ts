import { createAgentTool } from '@arvo-tools/agentic';
import { cleanString } from 'arvo-core';
import z from 'zod';
import { board } from '../../../kanban/config.ts';

export const readArtefact = () =>
  createAgentTool({
    name: 'tool.read.kandban.artefact',
    description: cleanString(`
      Retrieve the contents of an artefact by ID. Use this to access work products
      created by other agents, humans, or previous interactions on the card.
    `),
    input: z.object({
      id: z.string().describe('The artefact ID to retrieve'),
    }),
    output: z.object({
      title: z.string().describe('Title of the artefact'),
      description: z.string().nullable().describe(
        'Metadata: creator, file type, or context',
      ),
      content: z.string().describe('The stored data—code, text, JSON, etc.'),
    }),
    fn: async ({ id }) => {
      const resp = await board.getArtefact(id);
      return {
        title: resp.fields?.Title,
        description: resp.fields?.['Additional Details'] ?? null,
        content: resp.fields?.Content ?? 'Empty Artefact',
      };
    },
  });
