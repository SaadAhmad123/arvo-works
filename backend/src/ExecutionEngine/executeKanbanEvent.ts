import { ArvoEvent } from 'arvo-core';
import { kanbanAgentContract } from '../handlers/agent.kanban.ts';
import { executeHandlers } from './executeHandlers.ts';
import { KanbanBoard } from '../nocodb/KanbanBoard.ts';
import { getBoard } from '../config.ts';
import { OnDomainedEventParam } from './onDomainedEvent/index.ts';

/**
 * Executes a Kanban event by processing it through handlers and updating the card based on the response.
 * Handles different event types including domained events and completion events.
 *
 * @param card - The Kanban card object being processed
 * @param botEmail - The email address of the bot executing the event
 * @param trigger - The ArvoEvent that triggered this execution
 * @param onDomainedEvent - Callback function to handle domained events
 *
 * @throws {Error} When handler execution fails or board updates fail
 *
 * @example
 * ```typescript
 * const event = createArvoEventFactory(contract).accepts({ ... });
 * await executeKanbanEvent(card, 'bot@example.com', event, onDomainedEvent);
 * ```
 */
export const executeKanbanEvent = async (
  card: Awaited<ReturnType<KanbanBoard['get']>>,
  botEmail: string,
  trigger: ArvoEvent,
  onDomainedEvent: (param: OnDomainedEventParam) => Promise<void>,
) => {
  const board = getBoard({ botEmail });
  const response = await executeHandlers(trigger);
  for (const evt of response) {
    if (evt.domain) {
      await onDomainedEvent({
        event: evt,
        card,
        botEmail,
      });
      continue;
    }
    if (evt.type !== kanbanAgentContract.metadata.completeEventType) {
      continue;
    }
    if (evt.data.response.status === 'DONE') {
      await board.update(card.id, {
        'Task Board Select Field': 'DONE',
        'Rationale': evt.data.response.rationale ?? '',
        'Result': `
${evt.data.response.summary ?? ''}

---

${evt.data.response.deliverable ?? ''}
        `,
      });
      await board.comment(card.id, 'Done, have a look :)');
    } else if (evt.data.response.status === 'INPROGRESS') {
      evt?.data?.response?.message &&
        await board.comment(card.id, evt.data.response.message);
      await board.update(card.id, {
        'Task Board Select Field': 'PROGRESSING',
        'Result': evt.data.response.deliverable ?? '',
      });
      await board.comment(card.id, 'Progressed, awaiting your input');
    } else {
      await board.comment(
        card.id,
        `Something went wrong. ${JSON.stringify(evt.data)}`,
      );
      await board.update(card.id, {
        'Task Board Select Field': 'PROGRESSING',
      });
    }
    console.log(`- Finalised Card -> Id:${card.id}`);
  }
};
