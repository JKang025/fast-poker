import { Card } from './Card';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffle();
  }

  private initializeDeck() {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'] as const;
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({ suit, rank });
      }
    }
  }

  private shuffle() {
    this.cards.sort(() => Math.random() - 0.5);
  }

  public drawCard(): Card | undefined {
    return this.cards.pop();
  }
}
