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

export const codeAgentContract = createArvoOrchestratorContract({
  uri: '#/kanban/amas/agent/code',
  name: 'code.agent',
  description: cleanString(`
    Analyzes and refactors code automatically with
    practical, simple solutions.
  `),
  versions: {
    '1.0.0': {
      init: z.object({
        cardId: z.string().describe(cleanString(`
          The unique identifier of the Kanban card being worked upon.
        `)),
        instructions: z.string().describe(cleanString(`
          Instructions specifying what analysis or refactoring to perform on the code.
        `)),
        code: z.string().describe(cleanString(`
          The source code to be analyzed and/or refactored.
        `)),
      }),
      complete: z.object({
        response: z.string().describe(cleanString(`
          The analysis findings, refactoring explanation, or general response to the request.
        `)),
        blocks: z.object({
          lang: z.string().describe('The programming language of the code'),
          filename: z.string().optional().describe(
            'Optional filename for the code block',
          ),
          code: z.string().describe('The refactored or example code'),
        }).optional().array().describe(cleanString(`
          Code blocks containing refactored code or examples when applicable.
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
      createArtefact: createArtefact({ source: codeAgentContract.type }),
    },
    handler: {
      '1.0.0': {
        llmResponseType: 'json',
        context: ({ input, tools }) => {
          const system = cleanString(`
            You are a practical code analysis and refactoring agent that 
            automatically processes code based on instructions. Your core principle
            is to provide simple, straightforward solutions without over-engineering or over-analyzing.
            Work with the provided code and when you need to make assumptions about the code 
            or its context, first infer what you believe should be assumed, then use 
            the ${tools.services.humanConversationContract.name} tool to verify your assumptions 
            with the user before proceeding. 
            
            Use your judgment to determine whether the instructions require code analysis, 
            refactoring, or both, then proceed autonomously once any necessary assumptions 
            are clarified. Provide the most practical and efficient solution unless specifically 
            asked for complex alternatives.
            
            Reach out for human clarification in two situations: 
            - When instructions are genuinely unclear or when you need to verify assumptions 
              about the code or its context.
            - When clarification is needed, first infer what you believe should be done or assumed, 
              then use the Human Conversation tool to confirm your understanding.
            
            It is also useful to keep the user informed about your progress and processing in a single
            comment via ${tools.tools.addComment.name}.
            
            Tool usage instructions:
            - Use ${tools.services.humanConversationContract.name} tool when you need to prompt the user for
              confirmation, input, or assumption verification.
            - Use ${tools.tools.addComment.name} tool for informational updates that don't require user response
          `);

          const messages: AgentMessage[] = [
            {
              role: 'user',
              content: {
                type: 'text',
                content: cleanString(`
                  Please Process the following code as per instructions.
                  
                  Card Id: 
                  ${input.data.cardId}

                  Instructions:
                  ${input.data.instructions}
                  
                  Code:
                  ${input.data.code}
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
