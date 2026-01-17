import {
  ArvoEvent,
  createArvoEventFactory,
  InferVersionedArvoContract,
} from 'arvo-core';
import { humanConversationContract } from '../handlers/human.conversation.contract.ts';
import { INTERNAL_EVENT_SOURCE, isBotEmail } from '../config.ts';
import { KanbanBoard } from '../nocodb/KanbanBoard.ts';
import { humanApprovalContract } from '../handlers/human.approval.contract.ts';
import { SimplePermissionManager } from '@arvo-tools/agentic';

/**
 * Parameters for handling domained event responses from human users.
 */
export type OnDomainedEventResponseParam = {
  /** Object containing the event ID in both raw and formatted forms */
  id: {
    /** The raw ID value */
    value: string;
    /** The formatted ID with prefix (e.g., "!!123") */
    formatted: string;
  };
  /** The previous ArvoEvent that triggered the human conversation */
  prevEvent: ArvoEvent;
  /** The Kanban card containing the human response */
  card: Awaited<ReturnType<KanbanBoard['get']>>;
  /** The email address of the bot processing the response */
  botEmail: string;
};

/**
 * Processes human responses to domained events by creating success events
 * that contain the human's response message.
 */
export const onDomainedEventResponse = async ({
  id,
  prevEvent,
  card,
}: OnDomainedEventResponseParam) => {
  const relevantComments = card.comments?.filter((comment) =>
    comment.comment?.includes(id.formatted) &&
    !isBotEmail(comment.created_by_email ?? '')
  );

  const eventMetaData = {
    subject: prevEvent.data?.parentSubject$$ ?? prevEvent.subject ??
      undefined,
    parentid: prevEvent.id ?? undefined,
    to: prevEvent.source ?? undefined,
    accesscontrol: prevEvent.accesscontrol ?? undefined,
  } as const;

  if (prevEvent.type === humanConversationContract.type) {
    const message = relevantComments?.length
      ? JSON.stringify(relevantComments)
      : 'The human has addressed your request. Read the card again to see the latest updates';

    return createArvoEventFactory(
      humanConversationContract.version('1.0.0'),
    ).emits({
      source: INTERNAL_EVENT_SOURCE,
      type: 'evt.human.conversation.success',
      ...eventMetaData,
      data: {
        response: message,
      },
    });
  }

  if (prevEvent.type === humanApprovalContract.type) {
    const approval = relevantComments.some((comment) => (
      comment.comment?.toLowerCase()?.includes('yes')
    ));
    return createArvoEventFactory(
      humanApprovalContract.version('1.0.0'),
    ).emits({
      source: INTERNAL_EVENT_SOURCE,
      type: 'evt.human.approval.success',
      ...eventMetaData,
      data: {
        approval,
      },
    });
  }

  if (prevEvent.type === SimplePermissionManager.CONTRACT.type) {
    const e = prevEvent as unknown as InferVersionedArvoContract<
      typeof SimplePermissionManager.VERSIONED_CONTRACT
    >['accepts'];
    const approval = relevantComments.some((comment) => (
      comment.comment?.toLowerCase()?.includes('yes')
    ));
    return createArvoEventFactory(
      SimplePermissionManager.VERSIONED_CONTRACT,
    ).emits({
      source: INTERNAL_EVENT_SOURCE,
      type: 'evt.arvo.default.simple.permission.request.success',
      ...eventMetaData,
      data: {
        granted: approval ? e.data.requestedTools : [],
        denied: approval ? [] : e.data.requestedTools,
      },
    });
  }
};
