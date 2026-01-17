import { cleanString } from 'arvo-core';
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
  IPermissionManager,
} from '@arvo-tools/agentic';
import { addComment } from './commons/agent.tools/addComment.ts';
import { calculatorAgentContract } from './agent.calculator.ts';
import { codeAgentContract } from './agent.code.ts';
import { readArtefact } from './commons/agent.tools/readArtefacts.ts';
import { createArtefact } from './commons/agent.tools/createArtefact.ts';
import { artefactPrompt } from './commons/prompts/artefacts.ts';
import { createKanbanAgentContract } from './commons/schemas/kanbanAgent.ts';

export const kanbanAgentContract = createKanbanAgentContract({
  uri: '#/kanban/amas/agent/kanban',
  name: 'agent.kanban',
  description: cleanString(`
    Autonomously executes tasks assigned through Kanban cards by analyzing 
    requirements, performing necessary work, and communicating progress or results.
  `),
});

export const kanbanAgent: EventHandlerFactory<{
  memory: IMachineMemory;
  onStream?: AgentStreamListener;
  permissionManager?: IPermissionManager;
}> = (
  { memory, onStream, permissionManager },
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
      createArtefact: createArtefact({ source: kanbanAgentContract.type }),
    },
    permissionManager,
    handler: {
      '1.0.0': {
        explicitPermissionRequired: (
          tools,
        ) => [tools.services.calculatorAgent.name],
        llmResponseType: 'json',
        context: ({ input, tools, selfContract }) => {
          const system = cleanString(`
            You (name: ${selfContract.accepts.type}) are an autonomous agent responsible
            for completing tasks assigned through Kanban cards. Analyze requirements, execute 
            work, and deliver results with clear communication.

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
                  
                  Email For Card Interactions: ${input.data.email} 

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
