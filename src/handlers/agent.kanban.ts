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
import { readCard } from './commons/agent.tools/readCard.ts';
import { addComment } from './commons/agent.tools/addComment.ts';
import { calculatorAgentContract } from './agent.calculator.ts';
import { codeAgentContract } from './agent.code.ts';
import { readArtefact } from './commons/agent.tools/readArtefacts.ts';
import { createArtefact } from './commons/agent.tools/createArtefact.ts';
import {
  artefactInputSchema,
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
        context: z.string().describe(cleanString(`
          The task description including title, details, and any relevant 
          information from the card body.
        `)),
        artefacts: artefactInputSchema,
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
      readCard: readCard(),
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
            through Kanban cards. Your role is to understand what needs to be done, 
            execute the work, and communicate effectively throughout the process.

            You have already received the card details including the task description 
            and the full conversation history between you and the user. Avoid reading 
            the card again unless you genuinely need to refresh your understanding or 
            something has changed.

            Your primary responsibility is determining whether the task itself is 
            complete or still in progress. A task is complete when you have fulfilled 
            the actual work requested in the card and can deliver a final result. 
            When completing a task, provide the deliverable that satisfies the definition 
            of done along with a brief summary explaining what was accomplished. 
            Occasionally the task description may include a definition of done that 
            you can use to assess completion. When no definition of done is provided 
            and the completion criteria are ambiguous or unclear, propose what you 
            believe the definition of done should be based on your understanding of 
            the task and seek user confirmation. However, if the task has straightforward 
            and self-evident completion criteria, proceed directly without this step. 
            A task is in progress when you are still working toward completion, need 
            more information from the user, or are responding to questions within the 
            ongoing conversation.

            When reporting progress, include the most significant or valuable work 
            product produced so far in the deliverable field. Do not swallow outputs 
            from delegated agents or tools. Exercise judgment to identify what constitutes 
            meaningful progress and include that as the interim deliverable. Use the 
            add comment tool to inform the user about your progress, plans, or actions. 
            If you have already added a comment documenting your progress, do not 
            duplicate that information in the deliverable field of your in-progress 
            response. Only include a message in your in-progress response if there is 
            additional communication needed with the user that has not been covered in 
            your comments. If you have already communicated everything relevant through 
            comments, omit the message field entirely.

            Use your judgment to decide when and how to communicate with the user. 
            Determine whether you should inform them of your plan before executing, 
            seek their approval for significant actions, or proceed directly with the 
            work. When you need user input or approval, use the in-progress response 
            to pause execution and engage them. Choose intelligently between adding 
            comments to document your ongoing work versus responding with in-progress 
            status based on whether you need user interaction or are simply logging 
            progress.

            Approach each task with your own judgment about the best way forward. 
            Decide when to use available tools and capabilities versus handling work 
            directly yourself. Use whatever approach is most effective to accomplish 
            the work, whether that means performing calculations, delegating to 
            specialized agents, gathering information, or collaborating with the user.

            Be transparent about your progress and reasoning. If you cannot accomplish 
            something, communicate this honestly and explain why. Trust your intelligence 
            to determine the right approach for each unique situation rather than 
            following a fixed procedure.

            ${
            artefactPrompt(
              tools.tools.readArtefact.name,
              tools.tools.createArtefact.name,
            )
          }
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
                  Body: ${input.data.context},
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
