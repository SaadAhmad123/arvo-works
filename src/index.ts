// import './otel.ts';
// import { fetchAddressableCards } from './kanban/reader.ts';
// import { start } from './utils/start.ts';
// import {
//   dispatchCard,
//   dispatchDomainedEventResponseFromCard,
// } from './ExecutionEngine/index.ts';
// import { domainedEventManager } from './ExecutionEngine/KanbanDomainedEventManager.ts';

import z from 'zod';
import { KanbanArtefact } from './nocodb/KanbanBoard.ts';

// await start(async () => {
//   const cards = await fetchAddressableCards();
//   console.log(`Detected ${cards.length} Card for System to address.`);
//   for (const card of cards) {
//     if ((await domainedEventManager.inflightCards()).includes(card.id)) {
//       dispatchDomainedEventResponseFromCard(card.id);
//     } else {
//       dispatchCard(card, card.card?.Assigned?.[0]?.email ?? 'unknown');
//     }
//   }
// }).finally(() => {
//   console.log('Application cleanup...');
// });

const schema = z.object({
  Title: z.string().optional().nullable(),
  Description: z.string().optional().nullable(),
  Content: z.string().optional().nullable(),

})

const artefact = new KanbanArtefact()
