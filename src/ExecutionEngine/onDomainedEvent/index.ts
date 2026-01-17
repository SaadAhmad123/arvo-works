import { ArvoEvent } from 'arvo-core';
import { humanConversationContract } from '../../handlers/human.conversation.contract.ts';
import { domainedEventManager } from '../KanbanDomainedEventManager.ts';
import { KanbanBoard } from '../../nocodb/KanbanBoard.ts';
import { getBoard } from '../../config.ts';
import { humanApprovalContract } from '../../handlers/human.approval.contract.ts';
import {
  createHumanApprovalComment,
  createHumanConversationComment,
  createPermissionComment,
} from './comments.ts';
import { SimplePermissionManager } from '@arvo-tools/agentic';

/**
 * Parameters for handling domained events in the Kanban system.
 */
export type OnDomainedEventParam = {
  /** The Kanban card object being processed */
  card: Awaited<ReturnType<KanbanBoard['get']>>;
  /** The email address of the bot handling the event */
  botEmail: string;
  /** The ArvoEvent that triggered this domained event */
  event: ArvoEvent;
};

/**
 * Handles domained events, specifically human conversation events by storing them
 * and posting comments to the Kanban card requesting human input.
 */
export const onDomainedEvent = async (
  { card, botEmail, event }: OnDomainedEventParam,
) => {
  console.log('domained event', event.toString(2));
  const { randomId } = await domainedEventManager.set(
    card.id,
    event as unknown as ArvoEvent,
  );

  if (event.type === humanConversationContract.type) {
    // deno-lint-ignore no-explicit-any
    const comment = createHumanConversationComment(randomId, event as any);
    console.log(
      `- Agent requesting input from human -> Id:${card.id}-${randomId}`,
    );
    await getBoard({ botEmail }).comment(card.id, comment);
    return;
  }

  if (event.type === humanApprovalContract.type) {
    // deno-lint-ignore no-explicit-any
    const comment = createHumanApprovalComment(randomId, event as any);
    console.log(
      `- Agent requesting approval from human -> Id:${card.id}-${randomId}`,
    );
    await getBoard({ botEmail }).comment(card.id, comment);
    return;
  }

  if (event.type === SimplePermissionManager.CONTRACT.type) {
    // deno-lint-ignore no-explicit-any
    const comment = createPermissionComment(randomId, event as any);
    console.log(
      `- Agent requesting permission from human -> Id:${card.id}-${randomId}`,
    );
    await getBoard({ botEmail }).comment(card.id, comment);
    return;
  }
};
