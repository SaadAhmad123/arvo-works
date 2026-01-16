import { createArvoEventFactory } from 'arvo-core';
import { board } from '../kanban/config.ts';

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { createOtelContextFromEvent } from './utils.ts';
import {
  resolveDomainedEventFromCartComments,
} from './KanbanDomainedEventManager.ts';
import { executeKanbanEvent } from './executeKanbanEvent.ts';
import { onDomainedEvent } from './onDomainedEvent.ts';
import { botEmails, INTERNAL_EVENT_SOURCE, tracer } from '../config.ts';
import { onDomainedEventResponse } from './onDomainedEventResponse.ts';
import { KanbanBoard } from '../nocodb/KanbanBoard.ts';

export const dispatchCard = async (
  card: Awaited<ReturnType<KanbanBoard['get']>>,
  botEmail: string,
) => {
  console.log(`Addressing Card -> Id:${card.id}`);
  const contract = botEmails[botEmail];
  if (!contract) {
    const err = `Unable to find contract for bot email -> ${botEmail}`;
    console.error(err);
    await board.update(card.id, {
      'Task Board Select Field': 'DONE',
      Result: err,
    });
  }
  await board.update(card.id, { 'Task Board Select Field': 'PROGRESSING' });
  const event = createArvoEventFactory(contract.version('1.0.0'))
    .accepts({
      source: INTERNAL_EVENT_SOURCE,
      data: {
        parentSubject$$: null,
        cardId: card.id,
        context: JSON.stringify(card.card),
        comments: card.comments.map((item) => ({
          role: item.created_by_email?.includes('@bot.com')
            ? 'assistant'
            : 'user',
          message: item.comment ?? '',
        })),
      },
    });
  await executeKanbanEvent(card.id, event, onDomainedEvent);
  console.log(`Addressed Card -> Id:${card.id}`);
};

export const dispatchDomainedEventResponseFromCard = async (
  cardId: string,
) => {
  const card = await board.get(cardId);
  const emails = Object.keys(botEmails);
  const domainedEvents = await resolveDomainedEventFromCartComments(
    cardId,
    JSON.stringify(
      card.comments.filter((item) =>
        !emails.includes(item.created_by_email ?? '')
      ),
    ),
  );

  console.log(
    `${domainedEvents.length} Human response detected...`,
    domainedEvents.map((item) => item.id),
  );
  if (!domainedEvents.length) return;

  await Promise.all(
    domainedEvents.map(({ id, event }) =>
      tracer.startActiveSpan(
        `Resolving Comment ${id}`,
        {
          kind: SpanKind.INTERNAL,
        },
        createOtelContextFromEvent(event),
        async (span) => {
          console.log(`Addressing response ${id}`);
          span.setStatus({ code: SpanStatusCode.OK });
          try {
            const e = await onDomainedEventResponse(
              { value: id, formatted: `!!${id}` },
              event,
              card,
            );
            if (e) {
              await executeKanbanEvent(cardId, e, onDomainedEvent);
            }
          } catch (e) {
            span.setStatus({ code: SpanStatusCode.ERROR });
            span.recordException(e as Error);
            throw e;
          } finally {
            span.end();
          }
        },
      )
    ),
  );

  console.log('Finalized event from human response');
};
