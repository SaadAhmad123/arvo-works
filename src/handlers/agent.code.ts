import { createArvoOrchestratorContract } from 'arvo-core';
import z from 'zod';
import { cleanString } from 'arvo-core';
import {
  AgentDefaults,
  AgentMessage,
  AgentStreamListener,
  Anthropic,
  anthropicLLMIntegration,
  createArvoAgent,
} from '@arvo-tools/agentic';
import {
  ArvoDomain,
  EventHandlerFactory,
  IMachineMemory,
} from 'arvo-event-handler';
import { humanConversationContract } from './human.conversation.contract.ts';
import { addComment } from './commons/agent.tools/addComment.ts';
import { readArtefact } from './commons/agent.tools/readArtefacts.ts';
import { createArtefact } from './commons/agent.tools/createArtefact.ts';
import {
  artefactContractSchema,
  baseAgentInputSchema,
} from './commons/schemas/base.ts';
import { artefactPrompt } from './commons/prompts/artefacts.ts';
import { readCard } from './commons/agent.tools/readCard.ts';

export const codeAgentContract = createArvoOrchestratorContract({
  uri: '#/kanban/amas/agent/code',
  name: 'code.agent',
  description: cleanString(`
    Analyzes and refactors code with practical solutions. Accepts code inline 
    or via artefact IDs, processes according to instructions, and returns analysis 
    summary with refactored code stored in artefacts.
  `),
  versions: {
    '1.0.0': {
      init: z.object({
        ...baseAgentInputSchema,
        instructions: z.string().describe(cleanString(`
          What analysis or refactoring to perform on the code.
        `)),
        code: z.string().optional().describe(cleanString(`
          Source code to analyze or refactor, provided inline.
        `)),
        artefacts: artefactContractSchema.optional().describe(cleanString(`
          Artefact IDs containing source code and additional supporting
          information/ code/ data so that that agent can provide the 
          best possible outcome.
        `)),
      }),
      complete: z.object({
        summary: z.string().describe(cleanString(`
          Brief summary of what was analyzed, refactored, or accomplished.
        `)),
        artefacts: artefactContractSchema.optional().describe(cleanString(`
          Artefact IDs containing refactored code or code outputs produced.
        `)),
      }),
    },
  },
});

export const codeAgent: EventHandlerFactory<{
  memory: IMachineMemory;
  onStream?: AgentStreamListener;
}> = (
  { memory, onStream },
) =>
  createArvoAgent({
    memory: memory,
    contracts: {
      self: codeAgentContract,
      services: {
        humanConversationContract: {
          contract: humanConversationContract.version('1.0.0'),
          domains: [ArvoDomain.FROM_EVENT_CONTRACT],
        },
      },
    },
    onStream,
    llm: anthropicLLMIntegration(
      new Anthropic.Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') }),
    ),
    tools: {
      addComment: addComment({ source: codeAgentContract.type }),
      readArtefact: readArtefact(),
      readCard: readCard(),
      createArtefact: createArtefact({ source: codeAgentContract.type }),
    },
    handler: {
      '1.0.0': {
        llmResponseType: 'json',
        context: ({ input, tools, selfContract }) => {
          const system = cleanString(`
            You (name: ${selfContract.accepts.type}) are a practical code analysis
            and refactoring agent. Provide simple,  straightforward solutions without 
            over-engineering.
            
            ${
            artefactPrompt(
              tools.tools.readArtefact.name,
              tools.tools.createArtefact.name,
            )
          }
            
            Read artefacts from the input to access source code when provided. Store 
            refactored code or substantial code outputs as artefacts and reference the 
            IDs in your response rather than including code inline. The artefacts must 
            be properly markdown formatted.
            
            
            When instructions are unclear or you need to make assumptions about the code 
            or its context, infer what you believe should be done or assumed, then use 
            ${tools.services.humanConversationContract.name} to verify with the user 
            before proceeding. Use ${tools.tools.addComment.name} for progress updates 
            that don't require user response.
            
            Determine whether instructions require analysis, refactoring, or both, then 
            proceed autonomously once assumptions are clarified. Provide the most practical 
            solution unless specifically asked for alternatives.
          `);

          const messages: AgentMessage[] = [
            {
              role: 'user',
              content: {
                type: 'text',
                content: cleanString(`
                  Please Process the following code as per instructions.

                  Email For Card Interactions: ${input.data.email} 

                  Card:
                  ID: ${input.data.cardId}
                  Instructions: ${input.data.instructions}
                  ${input.data.code ? `Code:\n${input.data.code}  ` : ''}
                  ${
                  input.data.artefacts?.length
                    ? `Artefacts:\n${JSON.stringify(input.data.artefacts)}`
                    : ''
                }
                `),
              },
              seenCount: 0,
            },
          ];

          return {
            system,
            messages,
          };
        },
        output: AgentDefaults.OUTPUT_BUILDER,
      },
    },
  });
