// import './otel.ts';
// import { fetchAddressableCards } from './kanban/reader.ts';
// import { start } from './utils/start.ts';
// import {
//   dispatchCard,
//   dispatchDomainedEventResponseFromCard,
// } from './ExecutionEngine/index.ts';
// import { domainedEventManager } from './ExecutionEngine/KanbanDomainedEventManager.ts';

import { board } from './kanban/config.ts';

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

// const resp = await artefact.create(
//   '2',
//   {
//   Title: 'file-saad',
//   Description: 'A test file',
//   Content: 'The content'
// })

// deno-lint-ignore no-explicit-any
let resp: any = await board.createArtefact('2', {
  Title: 'Some Sample Code',
  Content: 'Some sample content',
});

console.log(resp);

resp = await board.get('2');

console.log(resp);
