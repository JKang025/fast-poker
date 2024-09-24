import { Game } from './Game';
import { Player } from './models/Player';

export class GameManager {
  private static games: Map<string, Game> = new Map();

  public static createGame(gameId: string): Game {
    const game = new Game(gameId);
    this.games.set(gameId, game);
    return game;
  }

  public static getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  public static addPlayerToGame(gameId: string, player: Player) {
    const game = this.getGame(gameId);
    if (game) {
      game.addPlayer(player);
    } else {
      throw new Error('Game not found');
    }
  }

  public static removeGame(gameId: string) {
    this.games.delete(gameId);
  }
}
