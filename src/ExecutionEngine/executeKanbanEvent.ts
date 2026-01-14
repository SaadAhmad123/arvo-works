import { ArvoEvent } from 'arvo-core';
import { kanbanAgentContract } from '../handlers/agent.kanban/index.ts';
import { humanConversationContract } from '../handlers/human.conversation.contract.ts';
import { board } from '../kanban/config.ts';
import { executeHandlers } from './executeHandlers.ts';

export const executeKanbanEvent = async (
  cardId: string,
  event: ArvoEvent,
  onDomainedEvent: (cardId: string, event: ArvoEvent) => Promise<void>,
) => {
  const response = await executeHandlers(event);
  for (const evt of response) {
    if (evt.domain) {
      if (evt.type === humanConversationContract.type) {
        await onDomainedEvent(cardId, evt);
      }
      continue;
    }
    if (evt.type !== kanbanAgentContract.metadata.completeEventType) {
      continue;
    }
    console.log(`- Finalised Card -> Id:${cardId}`);
    board.update(cardId, {
      'Task Board Select Field': 'DONE',
      'Rationale': evt.data.rationale ?? '',
      'Result': evt.data.result ?? '',
    });
  }
};
