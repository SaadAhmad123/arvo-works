import { board, botEmail, cardSeenMemory as memory } from './config.ts';

export const fetchAddressableCards = async (
  limit = 5,
  cardSeenMemory = memory,
) => {
  const email = botEmail;
  const stages: Parameters<typeof board['list']>[0] = ['PROGRESSING', 'TODO'];

  const items = await board.list(stages, {
    filter: (data) => data?.Assigned?.[0]?.email === email,
  });

  const cards = await Promise.all(
    items.map((item) => board.get(item.id.toString())),
  );
  const unseenCards: typeof cards = [];

  for (const card of cards) {
    if (unseenCards.length >= limit) break;
    const relevantCommentIds: string[] = (card.comments ?? []).filter((item) =>
      item.created_by_email !== botEmail
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
