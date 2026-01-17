import { createAgentTool } from '@arvo-tools/agentic';
import { cleanString } from 'arvo-core';
import z from 'zod';
import { baseAgentInputSchema } from '../schemas/base.ts';
import { getBoard } from '../../../config.ts';

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
      ...baseAgentInputSchema,
      title: z.string().describe(
        'Short descriptive title (e.g., "Generated API client code")',
      ),
      content: z.string().describe(
        'The actual data to store—code, text, JSON, or any work product, etc. Must not be empty',
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
    fn: async ({ cardId, email, content, additional, title }) => {
      const result = await getBoard({ botEmail: email }).createArtefact(
        cardId,
        {
          Title: title,
          Content: content ?? '',
          'Additional Details': `
Created by Agent: ${params.source}

---

${additional}
      `,
        },
      );
      return {
        artefactId: result.id.toString(),
      };
    },
  });
