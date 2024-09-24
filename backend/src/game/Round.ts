// src/game/Round.ts
import { Deck } from './models/Deck';
import { Player } from './models/Player';
import { Card } from './models/Card';
import { HandEvaluator } from './HandEvaluator';

type RoundState = 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

export class Round {
  private players: Player[];
  private deck: Deck;
  private communityCards: Card[];
  private pot: number;
  private currentTurnIndex: number;
  private state: RoundState;
  private currentBet: number;
  private highestBet: number;
  private actionQueue: Array<() => void>;
  private isProcessing: boolean;

  constructor(players: Player[]) {
    this.players = players;
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.currentTurnIndex = 0;
    this.state = 'PRE_FLOP';
    this.currentBet = 0;
    this.highestBet = 0;
    this.actionQueue = [];
    this.isProcessing = false;
  }

  public getCommunityCards(): Card[] {
    return this.communityCards;
  }

  public getPot(): number {
    return this.pot;
  }

  public getState(): RoundState {
    return this.state;
  }

  public getPlayers(): Player[] {
    return this.players;
  }

  public startRound(): Player[] {
    this.dealCards();
    // Initialize betting variables
    this.currentBet = 0;
    this.highestBet = 0;
    return this.players;
  }

  private dealCards() {
    for (const player of this.players) {
      player.hand = []; // Reset player's hand
      player.hand.push(this.deck.drawCard()!, this.deck.drawCard()!);
    }
  }

  public proceedToNextPhase(): Player[] {
    switch (this.state) {
      case 'PRE_FLOP':
        this.state = 'FLOP';
        this.dealCommunityCards(3);
        break;
      case 'FLOP':
        this.state = 'TURN';
        this.dealCommunityCards(1);
        break;
      case 'TURN':
        this.state = 'RIVER';
        this.dealCommunityCards(1);
        break;
      case 'RIVER':
        this.state = 'SHOWDOWN';
        this.determineWinner();
        break;
      case 'SHOWDOWN':
        // Round is complete
        break;
      default:
        break;
    }
    // Reset player bets for the next round
    this.resetPlayerBets();
    // Reset highest bet
    this.highestBet = 0;
    // Reset current turn index
    this.currentTurnIndex = 0;
    // Reset action states
    this.players.forEach(player => {
      if (!player.hasFolded && player.isActive) {
        player.hasActed = false;
      }
    });
    return this.players;
  }

  private dealCommunityCards(count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.deck.drawCard();
      if (card) {
        this.communityCards.push(card);
      }
    }
  }

  public handlePlayerAction(
    playerId: string,
    actionType: 'fold' | 'call' | 'raise',
    amount?: number
  ): Player[] {
    this.queueAction(async () => {
      const player = this.players.find(p => p.id === playerId);
      if (!player || !player.isActive || player.hasFolded) {
        throw new Error('Invalid or inactive player');
      }

      switch (actionType) {
        case 'fold':
          player.hasFolded = true;
          console.log(`${player.username} has folded.`);
          break;
        case 'call':
          this.handleCall(player);
          break;
        case 'raise':
          if (amount === undefined || amount <= 0) {
            throw new Error('Invalid raise amount');
          }
          this.handleRaise(player, amount);
          break;
        default:
          throw new Error('Unknown action type');
      }

      // Check if betting round is over
      if (this.isBettingRoundComplete()) {
        this.proceedToNextPhase();
      } else {
        this.moveToNextPlayer();
      }
    });

    // Return updated players after processing the action
    return this.players;
  }

  private handleCall(player: Player) {
    const callAmount = this.highestBet - player.currentBet;
    if (player.chips < callAmount) {
      throw new Error(`${player.username} does not have enough chips to call.`);
    }
    player.chips -= callAmount;
    player.currentBet += callAmount;
    this.pot += callAmount;
    console.log(`${player.username} has called ${callAmount} chips.`);
  }

  private handleRaise(player: Player, amount: number) {
    const totalRaise = this.highestBet - player.currentBet + amount;
    if (player.chips < totalRaise) {
      throw new Error(`${player.username} does not have enough chips to raise.`);
    }
    player.chips -= totalRaise;
    player.currentBet += totalRaise;
    this.pot += totalRaise;
    this.highestBet = player.currentBet;
    console.log(`${player.username} has raised by ${amount} chips to ${this.highestBet} chips.`);
    // Reset other players' action states
    this.players.forEach(p => {
      if (p.id !== player.id && !p.hasFolded && p.isActive) {
        p.hasActed = false;
      }
    });
  }

  private isBettingRoundComplete(): boolean {
    // Betting round is complete if all active players have acted and no one can raise
    return this.players
      .filter(p => p.isActive && !p.hasFolded)
      .every(p => p.hasActed && p.currentBet === this.highestBet);
  }

  private moveToNextPlayer() {
    // Find the next player who is active and hasn't folded
    let attempts = 0;
    const totalPlayers = this.players.length;
    while (attempts < totalPlayers) {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % totalPlayers;
      const currentPlayer = this.players[this.currentTurnIndex];
      if (currentPlayer.isActive && !currentPlayer.hasFolded && !currentPlayer.hasActed) {
        // Notify the current player to take action
        console.log(`It's now ${currentPlayer.username}'s turn.`);
        break;
      }
      attempts++;
    }
  }

  private resetPlayerBets() {
    this.players.forEach(player => {
      player.currentBet = 0;
      player.hasActed = false;
    });
    this.pot = 0;
  }

  private async determineWinner() {
    // Gather all active players who haven't folded
    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);

    if (activePlayers.length === 0) {
      console.log('All players have folded. No winner.');
      return;
    }

    // Find all players with the highest score
    const winners = HandEvaluator.compareHands(activePlayers)

    // Distribute the pot
    const share = Math.floor(this.pot / winners.length);
    winners.forEach(winner => {
      winner.chips += share;
      console.log(`${winner.username} wins ${share} chips.`);
    });

    // Handle any remaining chips due to integer division
    const remaining = this.pot - share * winners.length;
    if (remaining > 0) {
      winners[0].chips += remaining;
      console.log(`${winners[0].username} receives the remaining ${remaining} chips.`);
    }

    // Round is complete
    this.state = 'SHOWDOWN';
  }




  private queueAction(action: () => void) {
    this.actionQueue.push(action);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      if (action) {
        try {
          await action();
        } catch (error) {
          console.error('Error processing action:', error);
        }
      }
    }

    this.isProcessing = false;
  }
}
