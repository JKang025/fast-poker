import { Deck } from './models/Deck';
import { Player } from './models/Player';
import { Card } from './models/Card';
import { HandEvaluator } from './HandEvaluator';

type GameState = 'WAITING' | 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'FINISHED';

export class Game {
  public id: string;
  private players: Player[] = [];
  private deck: Deck = new Deck();
  private communityCards: Card[] = [];
  private pot: number = 0;
  private currentTurnIndex: number = 0;
  private state: GameState = 'WAITING';
  private currentBet: number = 0;
  private highestBet: number = 0;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Adds a player to the game.
   * @param player The player to add.
   */
  public addPlayer(player: Player) {
    if (this.state !== 'WAITING') {
      throw new Error('Cannot join a game in progress');
    }
    this.players.push(player);
  }

  public getPlayers(){
      return this.players
  }

  /**
   * Starts the game by initializing the first phase and dealing cards.
   */
  public startGame() {
    if (this.players.length < 2) {
      throw new Error('Need at least two players to start the game');
    }
    this.state = 'PRE_FLOP';
    this.dealCards();
    // Proceed to the first betting round

    this.currentBet = 0;
    this.highestBet = 0;

    // Initialize the first turn
    this.currentTurnIndex = this.getNextActivePlayerIndex(-1); // Start from the first active player
    this.notifyCurrentPlayerTurn();
  }

  /**
   * Deals two cards to each player.
   */
  private dealCards() {
    for (const player of this.players) {
      player.hand = []; // Reset player's hand
      player.hand.push(this.deck.drawCard()!, this.deck.drawCard()!);
    }
  }

  /**
   * Proceeds to the next phase of the game (e.g., FLOP, TURN, RIVER, SHOWDOWN).
   */
  public proceedToNextPhase() {
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
        return; // End the game after showdown
      default:
        return;
    }

    // Reset player bets for the next round
    this.resetPlayerBets();
    // Reset highest bet
    this.highestBet = 0;
    // Reset action states
    this.players.forEach(player => {
      player.resetForNewRound();
    });
    // Initialize the next turn
    this.currentTurnIndex = this.getNextActivePlayerIndex(-1); // Start from the first active player
    this.notifyCurrentPlayerTurn();
  }

  /**
   * Deals a specified number of community cards.
   * @param count Number of cards to deal.
   */
  private dealCommunityCards(count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.deck.drawCard();
      if (card) {
        this.communityCards.push(card);
      }
    }
  }

  /**
   * Handles a player's action (fold, call, raise).
   * @param playerId The ID of the player.
   * @param actionType The type of action.
   * @param amount The amount for a raise.
   */
  public handlePlayerAction(playerId: string, actionType: 'fold' | 'call' | 'raise', amount?: number) {
    this.queueAction(async () => {
      const player = this.players.find(p => p.id === playerId);
      if (!player || !player.isActive || player.hasFolded) {
        throw new Error('Invalid or inactive player');
      }

       // Retrieve the current turn player
    const currentPlayer = this.getCurrentTurnPlayer();

    // Check if currentPlayer is undefined or if it's not the player's turn
    if (!currentPlayer || playerId !== currentPlayer.id) {
      throw new Error("It's not your turn");
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

      // Mark that the player has acted
      player.hasActed = true;

      // Check if betting round is over
      if (this.isBettingRoundComplete()) {
        this.proceedToNextPhase();
      } else {
        this.moveToNextPlayer();
      }
    });
  }

  /**
   * Handles a call action by a player.
   * @param player The player who is calling.
   */
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

  /**
   * Handles a raise action by a player.
   * @param player The player who is raising.
   * @param amount The amount to raise.
   */
  private handleRaise(player: Player, amount: number) {
    const totalRaise = (this.highestBet - player.currentBet) + amount;
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

  /**
   * Checks if the current betting round is complete.
   * @returns True if the betting round is complete, else false.
   */
  private isBettingRoundComplete(): boolean {
    // Betting round is complete if all active players have acted and no one can raise
    return this.players.filter(p => p.isActive && !p.hasFolded).every(p => p.hasActed && p.currentBet === this.highestBet);
  }

  /**
   * Moves the turn to the next active player.
   */
  private moveToNextPlayer() {
    const totalPlayers = this.players.length;
    let attempts = 0;

    while (attempts < totalPlayers) {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % totalPlayers;
      const currentPlayer = this.players[this.currentTurnIndex];
      if (currentPlayer.isActive && !currentPlayer.hasFolded) {
        console.log(`It's now ${currentPlayer.username}'s turn.`);
        this.notifyCurrentPlayerTurn();
        return;
      }
      attempts++;
    }

    // If all players have acted or folded, proceed to next phase
    this.proceedToNextPhase();
  }

  /**
   * Resets the current bets of all players for the next betting round.
   */
  private resetPlayerBets() {
    this.players.forEach(player => {
      player.currentBet = 0;
      player.hasActed = false;
    });
    this.pot = 0;
  }

  /**
   * Determines the winner(s) of the game and distributes the pot accordingly.
   */
  private async determineWinner() {
    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);
    const winners = HandEvaluator.compareHands(activePlayers);

    if (winners.length === 0) {
      console.log('No winners could be determined.');
      return;
    }

    const share = Math.floor(this.pot / winners.length);
    winners.forEach(winner => {
      winner.chips += share;
      console.log(`${winner.username} wins ${share} chips.`);
    });

    // Handle any remaining chips due to integer division
    const remaining = this.pot - (share * winners.length);
    if (remaining > 0) {
      winners[0].chips += remaining;
      console.log(`${winners[0].username} receives the remaining ${remaining} chips.`);
    }

    this.state = 'FINISHED';
    // Optionally, notify players that the game has finished
  }

  /**
   * Retrieves the current game state, including whose turn it is.
   * @returns The current game state.
   */
  public getGameState() {
    // Safeguard: Ensure there is at least one player
    const currentPlayer = this.getCurrentTurnPlayer();

    return {
      id: this.id,
      players: this.players.map(player => ({
        id: player.id,
        username: player.username,
        chips: player.chips,
        isActive: player.isActive,
        hasFolded: player.hasFolded,
        currentBet: player.currentBet,
        hand: player.hand,
      })),
      communityCards: this.communityCards,
      pot: this.pot,
      state: this.state,
      currentTurn: currentPlayer
        ? {
            playerId: currentPlayer.id,
            username: currentPlayer.username,
            position: this.currentTurnIndex, // Player's position in the turn order
          }
        : null, // No current turn if no players are active
    };
  }

  /**
   * Retrieves the player whose turn it currently is.
   * @returns The current player, or undefined if no active players.
   */
  private getCurrentTurnPlayer(): Player | undefined {
    if (this.players.length === 0) return undefined;
    return this.players[this.currentTurnIndex];
  }

  /**
   * Finds the next active player index starting from a given index.
   * @param startIndex The index to start searching from.
   * @returns The index of the next active player.
   */
  private getNextActivePlayerIndex(startIndex: number): number {
    const totalPlayers = this.players.length;
    let index = startIndex;

    for (let i = 0; i < totalPlayers; i++) {
      index = (index + 1) % totalPlayers;
      const player = this.players[index];
      if (player.isActive && !player.hasFolded) {
        return index;
      }
    }

    // If no active players found, return -1
    return -1;
  }

  /**
   * Notifies all players about the current player's turn.
   * This method should be connected to your event emission logic (e.g., Socket.IO).
   * For demonstration purposes, it's represented as a console log.
   */
  private notifyCurrentPlayerTurn() {
    const currentPlayer = this.getCurrentTurnPlayer();
    if (currentPlayer) {
      console.log(`It's now ${currentPlayer.username}'s turn.`);
      // Here, you would emit an event to notify all clients about the turn change.
      // For example:
      // io.to(this.id).emit('turnChanged', { currentTurn: { playerId: currentPlayer.id, username: currentPlayer.username } });
    } else {
      console.log('No active players left to take a turn.');
    }
  }

  // Handling concurrency
  private actionQueue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;

  /**
   * Queues an action to be processed sequentially to avoid race conditions.
   * @param action The action to queue.
   */
  public queueAction(action: () => Promise<void>) {
    this.actionQueue.push(action);
    this.processQueue();
  }

  /**
   * Processes the action queue sequentially.
   */
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
