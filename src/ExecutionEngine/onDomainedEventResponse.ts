import { ArvoEvent, createArvoEventFactory } from 'arvo-core';
import { humanConversationContract } from '../handlers/human.conversation.contract.ts';
import { board } from '../kanban/config.ts';
import { INTERNAL_EVENT_SOURCE } from './config.ts';

export const onDomainedEventResponse = async (
  id: { value: string; formatted: string },
  prevEvent: ArvoEvent,
  card: Awaited<ReturnType<typeof board['get']>>,
) => {
  if (prevEvent.type === humanConversationContract.type) {
    const relevantComments = card.comments?.filter((comment) =>
      comment.comment?.includes(id.formatted)
    );
    const message = relevantComments?.length
      ? JSON.stringify(relevantComments)
      : 'The human has addressed your request. Read the card again to see the latest updates';

    return createArvoEventFactory(
      humanConversationContract.version('1.0.0'),
    ).emits({
      source: INTERNAL_EVENT_SOURCE,
      type: 'evt.human.conversation.success',
      subject: prevEvent.data?.parentSubject$$ ?? prevEvent.subject ??
        undefined,
      parentid: prevEvent.id ?? undefined,
      to: prevEvent.source ?? undefined,
      accesscontrol: prevEvent.accesscontrol ?? undefined,
      data: {
        response: message,
      },
    });
  }
};
