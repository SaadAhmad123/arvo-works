import { cleanString, createArvoOrchestratorContract } from 'arvo-core';
import {
  type EventHandlerFactory,
  type IMachineMemory,
} from 'arvo-event-handler';
import {
  AgentDefaults,
  type AgentMessage,
  type AgentStreamListener,
  createArvoAgent,
  OpenAI,
  openaiLLMIntegration,
} from '@arvo-tools/agentic';

import z from 'zod';
import { readCard } from './tools/readCard.ts';
import { addComment } from './tools/addComment.ts';

export const kanbanAgentContract = createArvoOrchestratorContract({
  uri: '#/kanban/amas/agent/kanban',
  name: 'agent.kanban',
  description: cleanString(`
    An autonomous agent that retrieves Kanban cards, 
    analyzes their task requirements, executes the 
    requested work, and returns structured results 
    with detailed reasoning
  `),
  versions: {
    '1.0.0': {
      init: z.object({
        cardId: z.string().describe(cleanString(`
          Unique identifier of the Kanban card containing 
          the task that needs to be analyzed and executed
        `)),
      }),
      complete: z.object({
        cardId: z.string().describe(cleanString(`
          Unique identifier of the Kanban card that was 
          successfully processed
        `)),
        result: z.string().describe(cleanString(`
          Completed output or deliverable produced by 
          executing the task specified in the Kanban card
        `)),
        rationale: z.string().describe(cleanString(`
          Detailed explanation of the approach taken, 
          decisions made, and reasoning behind the final 
          result delivered for this task
        `)),
      }),
    },
  },
});

export const kanbanAgent: EventHandlerFactory<{
  memory: IMachineMemory;
  onStream?: AgentStreamListener;
}> = (
  { memory, onStream },
) =>
  createArvoAgent({
    memory: memory,
    contracts: {
      self: kanbanAgentContract,
      services: {},
    },
    onStream,
    llm: openaiLLMIntegration(
      new OpenAI.OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') }),
    ),
    tools: {
      readCard,
      addComment,
    },
    handler: {
      '1.0.0': {
        llmResponseType: 'json',
        context: ({ input }) => {
          const system = `
            You are kanban agents whose jobs it to read the card assigned to 
            you via the tools available to you. The requirements of the task
            are in the card details along side the comments in the card which 
            are made by the human or you. 

            Add your comment as to what you planned and performed. 
            You must also mention the final result in a comment along
            with the output. 
            
            You must respond with cardId you addressed, the final result and your 
            rational on the result.

            If you cannot accomplish that task then tell the user honestly that 
            you could not accomplish that task and the rational on why you could not 
            in your response
          `;

          const message: AgentMessage = {
            role: 'user',
            content: {
              type: 'text',
              content:
                `You are assign the card (UUID = '${input.data.cardId}'). Please address it`,
            },
            seenCount: 0,
          };

          return {
            system,
            messages: [message],
          };
        },
        output: AgentDefaults.OUTPUT_BUILDER,
      },
    },
  });
