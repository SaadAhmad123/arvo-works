import { ArvoEvent } from 'arvo-core';
import { humanConversationContract } from '../handlers/human.conversation.contract.ts';
import { board } from '../kanban/config.ts';
import { domainedEventManager } from './KanbanDomainedEventManager.ts';

export const onDomainedEvent = async (cardId: string, event: ArvoEvent) => {
  if (event.type === humanConversationContract.type) {
    const { randomId } = await domainedEventManager.set(
      cardId,
      event as unknown as ArvoEvent,
    );
    const comment = `
[${randomId}]

Comment by Agent: ${event.source}
      
---

${event.data.prompt}

---

**Please respond with** \`!!${randomId}\` **at the start of the response.**
    `;
    console.log(
      `- Agent requesting input from human -> Id:${cardId}-${randomId}`,
    );
    await board.comment(cardId, comment);
  }
};
