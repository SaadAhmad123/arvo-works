import { CardSeenMemory } from './CardSeenMemory.ts';
import { cardSchema, getBoard, isBotEmail } from '../config.ts';
import z from 'zod';
import { envVar } from '../envVars.ts';

/**
 * Global instance of CardSeenMemory for tracking which cards have been processed.
 */
export const cardSeenMemory = new CardSeenMemory();

/**
 * Fetches addressable cards from the board that haven't been seen yet and are assigned to bot emails.
 *
 * This function retrieves cards from specific stages (PROGRESSING, TODO) that are assigned to
 * bot email addresses and filters out cards that have already been processed. It uses the
 * CardSeenMemory to track which cards and their comments have been seen to avoid duplicate processing.
 *
 * @param limit - Maximum number of unseen cards to return (default: 5)
 * @returns Promise that resolves to an array of unseen cards with their full details
 *
 * @throws Will throw an error if the board cannot be accessed or if there are issues with the NocoDB token
 * @throws Will throw an error if card retrieval fails for any individual card
 *
 * @example
 * ```typescript
 * // Fetch up to 5 unseen cards
 * const cards = await fetchAddressableCards();
 * console.log(`Found ${cards.length} unseen cards`);
 * ```
 */
export const fetchAddressableCards = async (
  limit = 5,
) => {
  const stages: z.infer<typeof cardSchema>['Task Board Select Field'][] = [
    'PROGRESSING',
    'TODO',
  ];
  const board = getBoard({ token: envVar('NOCODB_TOKEN') });
  const items = await board.list(stages, {
    filter: (data) => isBotEmail(data?.Assigned?.[0]?.email ?? ''),
  });

  const cards = await Promise.all(
    items.map((item) => board.get(item.id.toString())),
  );
  const unseenCards: typeof cards = [];

  for (const card of cards) {
    if (unseenCards.length >= limit) break;
    const relevantCommentIds: string[] = (card.comments ?? []).filter((item) =>
      !isBotEmail(item.created_by_email ?? '')
    ).map((item) => item.id);
    if (
      await cardSeenMemory.isSeen(
        card.id,
        relevantCommentIds,
      )
    ) {
      continue;
    }
    unseenCards.push(card);
    await cardSeenMemory.set(card.id, relevantCommentIds);
  }

  return unseenCards;
};
