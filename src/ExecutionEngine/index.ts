import { createArvoEventFactory } from 'arvo-core';

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { createOtelContextFromEvent } from './utils.ts';
import {
  resolveDomainedEventFromCartComments,
} from './KanbanDomainedEventManager.ts';
import { executeKanbanEvent } from './executeKanbanEvent.ts';
import { onDomainedEvent } from './onDomainedEvent/index.ts';
import {
  botConfig,
  getBoard,
  INTERNAL_EVENT_SOURCE,
  isBotEmail,
  tracer,
} from '../config.ts';
import { onDomainedEventResponse } from './onDomainedEventResponse.ts';
import { KanbanBoard } from '../nocodb/KanbanBoard.ts';
import { createKanbanAgentContract } from '../handlers/commons/schemas/kanbanAgent.ts';

/**
 * Dispatches a Kanban card for processing by creating and executing an Arvo event.
 * Updates the card status to 'PROGRESSING' and handles the complete workflow.
 *
 * @param card - The Kanban card object retrieved from the board
 * @param botEmail - The email address of the bot processing the card
 *
 * @throws {Error} When unable to find contract for the bot email
 *
 * @example
 * ```typescript
 * const card = await getBoard(...).get('123');
 * await dispatchCard(card, 'bot@example.com');
 * ```
 */
export const dispatchCard = async (
  card: Awaited<ReturnType<KanbanBoard['get']>>,
  botEmail: string,
) => {
  console.log(`Addressing Card -> Id:${card.id}`);
  const board = getBoard({ botEmail });
  const contract = botConfig[botEmail].contract() as ReturnType<
    typeof createKanbanAgentContract
  >;
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
        email: botEmail,
        cardId: card.id,
        body: JSON.stringify(card.card),
        comments: card.comments.map((item) => ({
          role: item.created_by_email?.includes('@bot.com')
            ? 'assistant'
            : 'user',
          message: item.comment ?? '',
        })),
        artefacts: card.artefacts.map((item) => ({
          id: item.id.toString(),
          description: item.fields?.Title ?? 'Unknown',
        })),
      },
    });
  await executeKanbanEvent(card, botEmail, event, onDomainedEvent);
  console.log(`Addressed Card -> Id:${card.id}`);
};

/**
 * Processes human responses from card comments by resolving domained events and executing them.
 * Filters out bot comments and processes only human responses that contain event references.
 *
 * @param card - The Kanban card object containing comments to process
 * @param botEmail - The email address of the bot processing the responses
 *
 * @throws {Error} When event processing fails during span execution
 *
 * @example
 * ```typescript
 * const card = await getBoard(...).get('123');
 * await dispatchDomainedEventResponseFromCard(card, 'bot@example.com');
 * ```
 */
export const dispatchDomainedEventResponseFromCard = async (
  card: Awaited<ReturnType<KanbanBoard['get']>>,
  botEmail: string,
) => {
  const domainedEvents = await resolveDomainedEventFromCartComments(
    card.id,
    JSON.stringify(
      card.comments.filter((item) => !isBotEmail(item.created_by_email ?? '')),
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
              {
                id: { value: id, formatted: `!!${id}` },
                prevEvent: event,
                card,
                botEmail,
              },
            );
            if (e) {
              await executeKanbanEvent(card, botEmail, e, onDomainedEvent);
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
