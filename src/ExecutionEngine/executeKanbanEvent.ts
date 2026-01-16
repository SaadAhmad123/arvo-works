import { ArvoEvent } from 'arvo-core';
import { kanbanAgentContract } from '../handlers/agent.kanban.ts';
import { humanConversationContract } from '../handlers/human.conversation.contract.ts';
import { board } from '../kanban/config.ts';
import { executeHandlers } from './executeHandlers.ts';

export const executeKanbanEvent = async (
  cardId: string,
  trigger: ArvoEvent,
  onDomainedEvent: (cardId: string, event: ArvoEvent) => Promise<void>,
) => {
  const response = await executeHandlers(trigger);
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
    if (evt.data.response.status === 'DONE') {
      await board.update(cardId, {
        'Task Board Select Field': 'DONE',
        'Rationale': evt.data.response.rationale ?? '',
        'Result': `
${evt.data.response.summary ?? ''}

---

${evt.data.response.deliverable ?? ''}
        `,
      });
    } else if (evt.data.response.status === 'INPROGRESS') {
      evt?.data?.response?.message &&
        await board.comment(cardId, evt.data.response.message);
      await board.update(cardId, {
        'Task Board Select Field': 'PROGRESSING',
        'Result': evt.data.response.deliverable ?? '',
      });
    } else {
      await board.comment(
        cardId,
        `Something went wrong. ${JSON.stringify(evt.data)}`,
      );
      await board.update(cardId, {
        'Task Board Select Field': 'PROGRESSING',
      });
    }
    console.log(`- Finalised Card -> Id:${cardId}`);
  }
};
