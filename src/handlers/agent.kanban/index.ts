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
import { calculatorAgentContract } from '../calculator.agent.ts';

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
          executing the task specified in the Kanban card.
          Critical: Must be in Markdown format
        `)),
        rationale: z.string().describe(cleanString(`
          Detailed explanation of the approach taken, 
          decisions made, and reasoning behind the final 
          result delivered for this task
          Critical: Must be in Markdown format
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
      services: {
        calculatorAgent: {
          contract: calculatorAgentContract.version('1.0.0'),
        },
      },
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
          const system = cleanString(`
            You are an autonomous Kanban task execution agent. Your workflow is:

            1. Read the assigned card using available tools to 
            understand task requirements and review any existing comments 
            from humans or previous executions.

            2. Analyze and execute the task based on card details. 
            Use available tools and services as needed. Whenever possible 
            use parallel tool calls to save cost

            3. Document your work by adding a comment that describes 
            your planned approach, actions taken, and final outcome 
            with the complete result.

            4. Respond with three required fields: cardId (the card you addressed), 
            result (2 sentence summary of what was accomplished), and rationale 
            (detailed explanation of your approach and decisions).

            For the result field, provide only a brief 2 sentence summary 
            since the full details are already in your card comment. In case the
            card comment do not contain the final result then you can put 
            the final result.

            If the task cannot be completed, respond honestly with an 
            explanation of what prevented successful execution and your 
            attempted approaches.

            All result and rationale outputs must be in Markdown format.
          `);

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
