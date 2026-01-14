import './otel.ts';
import { fetchAddressableCards } from './kanban/reader.ts';
import { start } from './utils/start.ts';
import {
  dispatchCard,
  dispatchDomainedEventResponseFromCard,
} from './ExecutionEngine/index.ts';
import { domainedEventManager } from './ExecutionEngine/KanbanDomainedEventManager.ts';

await start(async () => {
  const cards = await fetchAddressableCards();
  console.log(`Detected ${cards.length} Card for System to address.`);
  for (const card of cards) {
    if ((await domainedEventManager.inflightCards()).includes(card.id)) {
      dispatchDomainedEventResponseFromCard(card.id);
    } else {
      dispatchCard(card.id);
    }
  }
}).finally(() => {
  console.log('Application cleanup...');
});
