import { ArvoEvent } from 'arvo-core';
import { generateRandomId } from './utils.ts';

export class KanbanDomainedEventManager {
  private readonly dataMap = new Map<string, ArvoEvent>();
  private readonly cardMap = new Map<string, string>();

  private generateKey(cardId: string, randomId: string) {
    return `${cardId}-${randomId}`;
  }

  private generateRandomKey(cardId: string) {
    const randomId = generateRandomId();
    return {
      key: this.generateKey(cardId, randomId),
      randomId,
    };
  }

  async set(cardId: string, event: ArvoEvent) {
    for (let i = 0; i < 1000; i++) {
      const { key, randomId } = this.generateRandomKey(cardId);
      if (this.dataMap.has(key)) continue;
      this.dataMap.set(key, event);
      this.cardMap.set(key, cardId);
      return { key, cardId, randomId };
    }
    throw new Error('Unable to store the data due to id clash');
  }

  async get(cardId: string, randomId: string) {
    return this.dataMap.get(this.generateKey(cardId, randomId)) ?? null;
  }

  async delete(cardId: string, randomId: string) {
    this.dataMap.delete(this.generateKey(cardId, randomId));
    this.cardMap.delete(this.generateKey(cardId, randomId));
  }

  async inflightCards() {
    return Array.from(new Set(this.cardMap.values()));
  }
}

export const domainedEventManager = new KanbanDomainedEventManager();

function extractGeneratedIds(input: string): string[] {
  const regex = /!!([0-9A-Z]{4})/g;
  const matches = input.matchAll(regex);
  return Array.from(matches, (match) => match[1]);
}

export const resolveDomainedEventFromCartComments = async (
  cardId: string,
  comments: string,
) => {
  const ids = extractGeneratedIds(comments);
  console.log({ cardId, ids });
  if (!ids?.length) return [];
  const events: { id: string; event: ArvoEvent }[] = [];
  for (const id of ids) {
    const evt = await domainedEventManager.get(cardId, id);
    if (!evt) continue;
    events.push({ id, event: evt });
    await domainedEventManager.delete(cardId, id);
  }
  return events;
};
