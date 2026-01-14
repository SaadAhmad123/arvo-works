export class CardSeenMemory {
  private readonly seenCards: Record<string, string[]> = {};

  async set(cardId: string, commentIds: string[]) {
    this.seenCards[cardId] = commentIds;
  }

  async isSeen(cardId: string, commentIds: string[]) {
    if (commentIds.length === 0 && this.seenCards[cardId]) return true;
    return this.seenCards[cardId] &&
      commentIds.every((comment) => this.seenCards[cardId].includes(comment));
  }
}
