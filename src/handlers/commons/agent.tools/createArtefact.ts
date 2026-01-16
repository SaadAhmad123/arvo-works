import { createAgentTool } from '@arvo-tools/agentic';
import { cleanString } from 'arvo-core';
import z from 'zod';
import { board } from '../../../kanban/config.ts';

export const createArtefact = (params: { source: string }) =>
  createAgentTool({
    name: 'tool.create.kandban.artefact',
    description: cleanString(`
      Store a work product (code, analysis, document, etc.) as a persistent
      artefact linked to the card. Use this to save outputs that should be
      accessible to other agents, humans, or future interactions. Returns the
      artefact ID for reference.
    `),
    input: z.object({
      cardId: z.string().describe('The card ID to attach this artefact to'),
      title: z.string().describe(
        'Short descriptive title (e.g., "Generated API client code")',
      ),
      content: z.string().describe(
        'The actual data to store—code, text, JSON, etc.',
      ),
      additional: z.string().optional().describe(
        'Optional metadata: file type, language, version, or context (max 30 words)',
      ),
    }),
    output: z.object({
      artefactId: z.string().describe(
        'Unique ID of the created artefact for future reference',
      ),
    }),
    fn: async ({ cardId, content, additional, title }) => {
      const result = await board.createArtefact(cardId, {
        Title: title,
        Content: content,
        'Additional Details': `
Created by Agent: ${params.source}

---

${additional}
      `,
      });
      // On error the error will be thrown
      return {
        artefactId: result.id.toString(),
      };
    },
  });
