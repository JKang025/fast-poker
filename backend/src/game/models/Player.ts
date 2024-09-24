import { Card } from './Card';

export class Player {
  public id: string;
  public username: string;
  public hand: Card[] = [];
  public chips: number;
  public isActive: boolean = true;
  public hasFolded: boolean = false;
  public currentBet: number = 0;
  public hasActed: boolean = false;

  constructor(id: string, username: string, chips: number) {
    this.id = id;
    this.username = username;
    this.chips = chips;
  }

  public resetForNewRound() {
    this.hand = [];
    this.isActive = true;
    this.hasFolded = false;
    this.currentBet = 0;
    this.hasActed = false;
  }
}
