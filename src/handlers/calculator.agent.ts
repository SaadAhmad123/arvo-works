import { createArvoOrchestratorContract } from 'arvo-core';
import {
  ArvoDomain,
  type EventHandlerFactory,
  type IMachineMemory,
} from 'arvo-event-handler';
import {
  AgentDefaults,
  Anthropic,
  anthropicLLMIntegration,
  createArvoAgent,
} from '@arvo-tools/agentic';
import z from 'zod';
import { cleanString } from 'arvo-core';
import type { AgentStreamListener } from '@arvo-tools/agentic';
import { calculatorContract } from './calculator.service.ts';
import { humanConversationContract } from './human.conversation.contract.ts';

export const calculatorAgentContract = createArvoOrchestratorContract({
  uri: '#/org/amas/agent/calculator',
  name: 'agent.calculator',
  description:
    'This is a calculator agent which can take your request in natural language and if possible return an output of the calculation',
  versions: {
    '1.0.0': {
      init: AgentDefaults.INIT_SCHEMA,
      complete: z.object({
        output: z.number().nullable().describe(
          'The output of the calculation. If the output is not a number then this is null',
        ),
        remarks: z.string().describe(
          'The thought process/ remarks of the agent on the request and output',
        ),
      }),
    },
  },
});

export const calculatorAgent: EventHandlerFactory<
  {
    memory: IMachineMemory;
    onStream?: AgentStreamListener;
  }
> = ({ memory, onStream }) =>
  createArvoAgent({
    contracts: {
      self: calculatorAgentContract,
      services: {
        calculatorContract: {
          contract: calculatorContract.version('1.0.0'),
        },
        humanConversation: {
          contract: humanConversationContract.version('1.0.0'),
          domains: [ArvoDomain.FROM_EVENT_CONTRACT],
        },
      },
    },
    onStream,
    memory,
    llm: anthropicLLMIntegration(
      new Anthropic.Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') }),
      {
        invocationParam: {
          model: 'claude-4-sonnet-20250514',
          stream: true,
          max_tokens: 4096,
          temperature: 0,
        },
        executionunits: (prompt, completion) => {
          return prompt + completion;
        },
      },
    ),
    handler: {
      '1.0.0': {
        llmResponseType: 'json',
        context: AgentDefaults.CONTEXT_BUILDER(({ tools }) =>
          cleanString(`
              You are strictly a calculation agent. Your sole purpose is to understand user requests
              and use the ${tools.services.calculatorContract.name} to perform calculations
              and respond with results. If the user request is not related to calculation, or you find
              that your tool cannot perform the calculation due to tool limitations,
              then respond with a null output and in remarks explain to the user why you were 
              not able to address the request.

              For complex queries that you believe are solvable, you can break down the 
              query into smaller calculations which your tool can perform and use the tool to 
              solve each part.

              **Human approval workflow:** Before executing any calculation tool calls, you must first 
              use the ${tools.services.humanConversation.name} to present your execution plan to the 
              human user. Clearly describe what calculations you intend to perform and how you will 
              solve their request. Wait for the human to explicitly approve your plan before proceeding 
              with the ${tools.services.calculatorContract.name}. If the human asks questions or requests 
              clarification about your plan, continue using the ${tools.services.humanConversation.name} 
              to address their questions until they explicitly approve. Only execute the calculation tools 
              after receiving clear approval from the human.

              **Critical tool use direction:** If you determine that a request needs 
              multiple tool calls and they can be made in parallel, then always execute parallel 
              tool calls. You are banned from performing sequential tool calls when they can 
              be parallelized.
            `)
        ),
        output: AgentDefaults.OUTPUT_BUILDER,
      },
    },
  });
