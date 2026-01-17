import './otel.ts';
import { start } from './utils/start.ts';
import {
  dispatchCard,
  dispatchDomainedEventResponseFromCard,
} from './ExecutionEngine/index.ts';
import { domainedEventManager } from './ExecutionEngine/KanbanDomainedEventManager.ts';
import { fetchAddressableCards } from './fetchAddressableCards/index.ts';
import { isBotEmail } from './config.ts';
import { Hono } from 'hono';

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


const app = new Hono();

app.get('/hello', (c) => {
  return c.json({ message: "Hello World!" });
});

const abortController = new AbortController();

Deno.addSignalListener('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down...');
  abortController.abort();
});

try {
  console.log("Starting Hono.js HTTP server on port 8081...");
  console.log("Try: http://localhost:8081/hello");
  await Promise.race([
    Deno.serve({ 
      port: 8081,
      signal: abortController.signal 
    }, app.fetch),
    start(backgroundProcess)
  ]);
} catch (error) {
  if ((error as Error).name !== 'AbortError') {
    console.error('Application error:', error);
  }
} finally {
  console.log('Application cleanup...');
}
