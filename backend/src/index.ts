import './otel.ts';
import { start } from './utils/start.ts';
import {
  dispatchCard,
  dispatchDomainedEventResponseFromCard,
} from './ExecutionEngine/index.ts';
import { domainedEventManager } from './ExecutionEngine/KanbanDomainedEventManager.ts';
import { fetchAddressableCards } from './fetchAddressableCards/index.ts';
import { isBotEmail } from './config.ts';

async function backgroundProcess() {
  const cards = await fetchAddressableCards();
  console.log(`Detected ${cards.length} Card for System to address.`);
  for (const card of cards) {
    const email = card.card?.Assigned?.[0]?.email ?? 'unknown';
    if (!isBotEmail(email)) continue;
    if ((await domainedEventManager.inflightCards()).includes(card.id)) {
      dispatchDomainedEventResponseFromCard(card, email);
    } else {
      dispatchCard(card, email);
    }
  }
}

start(backgroundProcess);
