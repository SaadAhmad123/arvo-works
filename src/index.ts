import './otel.ts';
import { fetchAddressableCards } from './kanban/reader.ts';
import { start } from './utils/start.ts';
import {
  ConcurrentMachineMemory,
  createConcurrentEventBroker,
} from '@arvo-tools/concurrent';
import { ArvoEvent, createArvoEventFactory } from 'arvo-core';
import {
  kanbanAgent,
  kanbanAgentContract,
} from './handlers/agent.kanban/index.ts';
import { board } from './kanban/config.ts';

const memory = new ConcurrentMachineMemory();
const INTERNAL_EVENT_SOURCE = 'amas.kanban.source';

export const executeHandlers = async (
  event: ArvoEvent,
): Promise<ArvoEvent[]> => {
  const domainedEvents: ArvoEvent[] = [];
  const response = await createConcurrentEventBroker([
    { handler: kanbanAgent({ memory }) },
  ], {
    defaultHandlerConfig: {
      prefetch: 10,
    },
    onDomainedEvents: async ({ event }) => {
      domainedEvents.push(event);
    },
  }).resolve(event);
  return response ? [response, ...domainedEvents] : domainedEvents;
};

export const dispatchKanbanEvent = async (cardId: string) => {
  await board.update(cardId, {'Task Board Select Field': 'PROGRESSING'})
  const event = createArvoEventFactory(kanbanAgentContract.version('1.0.0'))
    .accepts({
      source: INTERNAL_EVENT_SOURCE,
      data: {
        parentSubject$$: null,
        cardId,
      },
    });
  const response = await executeHandlers(event);
  for (const evt of response) {
    console.log(evt.toString(2))
    if (evt.domain) {
      // TODO: Add domained event handling later. Right now just skip it
      continue
    }
    if (evt.type !== kanbanAgentContract.metadata.completeEventType) {
      // TODO: If there is some other event other then handle it later. Right now skip it
      continue
    }
    board.update(cardId, {
      'Task Board Select Field': 'DONE',
      'Rationale': evt.data.rationale ?? '',
      'Result': evt.data.result ?? ''
    })
  }
};

await start(async () => {
  const cards = await fetchAddressableCards();
  for (const card of cards) {
    dispatchKanbanEvent(card.id);
  }
}).finally(() => {
  console.log('Application cleanup...');
});
