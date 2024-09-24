// src/game/HandEvaluator.ts
import { Card } from './models/Card';
import { Player } from './models/Player';

export class HandEvaluator {
  private static rankOrder: { [key: string]: number } = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14,
  };

  private static evaluateHand(cards: Card[]): number {
    if (cards.length !== 5) {
      throw new Error('Hand must contain exactly 5 cards.');
    }

    const ranks = cards.map(card => this.rankOrder[card.rank]).sort((a, b) => a - b);
    const suits = cards.map(card => card.suit);

    const rankCounts: { [key: number]: number } = {};
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);
    const uniqueCounts = Object.values(rankCounts).sort((a, b) => b - a);

    const isFlush = suits.every(suit => suit === suits[0]);

    const isStraight = this.isConsecutive(ranks);

    // Special case: Ace can be low in a straight (A-2-3-4-5)
    const isLowAceStraight = JSON.stringify(ranks) === JSON.stringify([2, 3, 4, 5, 14]);
    const finalIsStraight = isStraight || isLowAceStraight;

    // Determine hand type
    let score = 0;

    if (finalIsStraight && isFlush && ranks[4] === 14) {
      // Royal Flush
      score = 1000000000;
    } else if (finalIsStraight && isFlush) {
      // Straight Flush
      score = 900000000 + ranks[4];
    } else if (uniqueCounts[0] === 4) {
      // Four of a Kind
      const fourRank = uniqueRanks.find(rank => rankCounts[rank] === 4) || 0;
      const kicker = uniqueRanks.find(rank => rankCounts[rank] !== 4) || 0;
      score = 800000000 + fourRank * 10000 + kicker;
    } else if (uniqueCounts[0] === 3 && uniqueCounts[1] === 2) {
      // Full House
      const threeRank = uniqueRanks.find(rank => rankCounts[rank] === 3) || 0;
      const pairRank = uniqueRanks.find(rank => rankCounts[rank] === 2) || 0;
      score = 700000000 + threeRank * 10000 + pairRank;
    } else if (isFlush) {
      // Flush
      score = 600000000;
      for (let i = ranks.length - 1; i >= 0; i--) {
        score += ranks[i] * Math.pow(10, (ranks.length - 1 - i) * 2);
      }
    } else if (finalIsStraight) {
      // Straight
      const highCard = isLowAceStraight ? 5 : ranks[4];
      score = 500000000 + highCard;
    } else if (uniqueCounts[0] === 3) {
      // Three of a Kind
      const threeRank = uniqueRanks.find(rank => rankCounts[rank] === 3) || 0;
      const kickers = uniqueRanks.filter(rank => rankCounts[rank] === 1).sort((a, b) => b - a);
      score = 400000000 + threeRank * 10000 + kickers[0] * 100 + kickers[1];
    } else if (uniqueCounts[0] === 2 && uniqueCounts[1] === 2) {
      // Two Pair
      const highPair = uniqueRanks.find(rank => rankCounts[rank] === 2) || 0;
      const lowPair = uniqueRanks.find(rank => rankCounts[rank] === 2 && rank !== highPair) || 0;
      const kicker = uniqueRanks.find(rank => rankCounts[rank] === 1) || 0;
      score = 300000000 + highPair * 1000000 + lowPair * 10000 + kicker;
    } else if (uniqueCounts[0] === 2) {
      // One Pair
      const pairRank = uniqueRanks.find(rank => rankCounts[rank] === 2) || 0;
      const kickers = uniqueRanks.filter(rank => rankCounts[rank] === 1).sort((a, b) => b - a);
      score = 200000000 + pairRank * 10000 + kickers[0] * 100 + kickers[1];
    } else {
      // High Card
      score = 100000000;
      for (let i = ranks.length - 1; i >= 0; i--) {
        score += ranks[i] * Math.pow(10, (ranks.length - 1 - i) * 2);
      }
    }

    return score;
  }

  private static isConsecutive(ranks: number[]): boolean {
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] !== ranks[i - 1] + 1) {
        return false;
      }
    }
    return true;
  }

  public static compareHands(players: Player[]): Player[] {
    let bestScore: number = -1;
    let winners: Player[] = [];

    for (const player of players) {
      if (player.hasFolded || !player.isActive) {
        continue; // Skip players who have folded or are inactive
      }

      const playerScore = this.evaluateHand(player.hand);

      if (playerScore > bestScore) {
        bestScore = playerScore;
        winners = [player];
      } else if (playerScore === bestScore) {
        winners.push(player);
      }
    }

    return winners;
  }
}
