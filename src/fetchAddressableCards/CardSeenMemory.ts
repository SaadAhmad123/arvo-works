/**
 * Memory management class for tracking which cards and their comments have been processed.
 *
 * This class provides an in-memory storage mechanism to track which cards have been seen
 * and which comments on those cards have been processed. It helps prevent duplicate
 * processing of cards and ensures that only new comments trigger reprocessing.
 */
export class CardSeenMemory {
  private readonly seenCards: Record<string, string[]> = {};

  /**
   * Marks a card as seen with the specified comment IDs.
   */
  async set(cardId: string, commentIds: string[]) {
    this.seenCards[cardId] = commentIds;
  }

  /**
   * Checks if a card has been seen with the specified comment configuration.
   *
   * This method determines if a card should be considered "seen" based on its
   * comment state. A card is considered seen if:
   * 1. It has no comments and has been seen before, OR
   * 2. All provided comment IDs have been seen before for this card
   */
  async isSeen(cardId: string, commentIds: string[]) {
    if (commentIds.length === 0 && this.seenCards[cardId]) return true;
    return this.seenCards[cardId] &&
      commentIds.every((comment) => this.seenCards[cardId].includes(comment));
  }
}
