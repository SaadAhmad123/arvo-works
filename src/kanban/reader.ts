import { botEmails } from '../config.ts';
import { board, cardSeenMemory as memory } from './config.ts';

export const fetchAddressableCards = async (
  limit = 5,
  cardSeenMemory = memory,
) => {
  const emails = Object.keys(botEmails);
  const stages: Parameters<typeof board['list']>[0] = ['PROGRESSING', 'TODO'];

  const items = await board.list(stages, {
    filter: (data) => emails.includes(data?.Assigned?.[0]?.email ?? ''),
  });

  const cards = await Promise.all(
    items.map((item) => board.get(item.id.toString())),
  );
  const unseenCards: typeof cards = [];

  for (const card of cards) {
    if (unseenCards.length >= limit) break;
    const relevantCommentIds: string[] = (card.comments ?? []).filter((item) =>
      !emails.includes(item.created_by_email ?? '')
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
