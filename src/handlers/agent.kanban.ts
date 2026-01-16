import { cleanString, createArvoOrchestratorContract } from 'arvo-core';
import {
  type EventHandlerFactory,
  type IMachineMemory,
} from 'arvo-event-handler';
import {
  AgentDefaults,
  type AgentMessage,
  type AgentStreamListener,
  Anthropic,
  anthropicLLMIntegration,
  createArvoAgent,
} from '@arvo-tools/agentic';

import z from 'zod';
import { addComment } from './commons/agent.tools/addComment.ts';
import { calculatorAgentContract } from './agent.calculator.ts';
import { codeAgentContract } from './agent.code.ts';
import { readArtefact } from './commons/agent.tools/readArtefacts.ts';
import { createArtefact } from './commons/agent.tools/createArtefact.ts';
import {
  artefactContractSchema,
  artefactPrompt,
} from './commons/prompts/artefacts.ts';

export const kanbanAgentContract = createArvoOrchestratorContract({
  uri: '#/kanban/amas/agent/kanban',
  name: 'agent.kanban',
  description: cleanString(`
    Autonomously executes tasks assigned through Kanban cards by analyzing 
    requirements, performing necessary work, and communicating progress or results.
  `),
  versions: {
    '1.0.0': {
      init: z.object({
        cardId: z.string().describe(cleanString(`
          The unique identifier of the Kanban card containing the task to execute.
        `)),
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
        codeAgent: {
          contract: codeAgentContract.version('1.0.0'),
        },
      },
    },
    onStream,
    llm: anthropicLLMIntegration(
      new Anthropic.Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') }),
    ),
    tools: {
      addComment: addComment({ source: kanbanAgentContract.type }),
      readArtefact: readArtefact(),
      createArtefact: createArtefact({ source: codeAgentContract.type }),
    },
    handler: {
      '1.0.0': {
        llmResponseType: 'json',
        context: ({ input, tools }) => {
          const system = cleanString(`
            You are an autonomous agent responsible for completing tasks assigned 
            through Kanban cards. Analyze requirements, execute work, and deliver 
            results with clear communication.

            ${
            artefactPrompt(
              tools.tools.readArtefact.name,
              tools.tools.createArtefact.name,
            )
          }

            Store work products that are substantive, structured, or will be referenced 
            later as artefacts. When delegating to sub-agents, create artefacts to 
            organize complex context or data and pass the artefact IDs as inputs. 
            Capture outputs from sub-agents or tools as artefacts when appropriate, 
            then reference those IDs for further processing or deliverable rather 
            than duplicating content.

            Mark tasks DONE when work is complete and you can provide a deliverable 
            meeting the completion criteria. Mark INPROGRESS when you need user input 
            or are pausing for their response. If completion criteria are unclear and 
            the task isn't straightforward, use INPROGRESS to propose your understanding 
            of done and wait for confirmation before significant work.

            Use comments to document plans, actions, or progress. Use the message field 
            in INPROGRESS when you need user response to continue. Do not duplicate 
            information across comments, deliverable, and message fields.

            Execute directly for tasks with clear requirements. Pause for approval when 
            requirements are ambiguous or actions have significant consequences. Be 
            transparent about limitations and explain honestly if you cannot accomplish 
            something.
          `);

          const messages: AgentMessage[] = [
            {
              role: 'user',
              content: {
                type: 'text',
                content: cleanString(`
                  You are assign the card. Please address it  
                  
                  Card: 
                  Id: ${input.data.cardId}
                  Body: ${input.data.body},
                  Available Artefacts: ${JSON.stringify(input.data.artefacts)}
                `),
              },
              seenCount: 0,
            },
          ];

          for (const item of input.data.comments) {
            messages.push({
              role: item.role,
              content: {
                type: 'text',
                content: item.message,
              },
              seenCount: 0,
            });
          }

          return {
            system,
            messages,
          };
        },
        output: AgentDefaults.OUTPUT_BUILDER,
      },
    },
  });
