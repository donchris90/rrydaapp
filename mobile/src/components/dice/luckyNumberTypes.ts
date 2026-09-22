// Type definitions for Lucky Number / SumDice Game

export type DiceRoundStatus = 'OPEN' | 'ROLLING' | 'SETTLED';

export type QuickBetType = 'S' | 'B' | 'E' | 'O' | null;

export type RoundOutcomeType = 'WIN' | 'LOSE' | 'NOT_PLAYED';

export interface RoundResultSummary {
  outcome: RoundOutcomeType;
  roundNumber: number;
  dice: [number, number, number];
  sum: number;
  isSmall: boolean;
  isEven: boolean;
  betAmount: number;
  payoutAmount: number;
  netProfit: number;
  multiplier: number;
  selectedNumbers: number[];
}

export interface DiceRoundHistory {
  id: string;
  roundNumber: number;
  dice: [number, number, number];
  sum: number;
  isSmall: boolean;
  isEven: boolean;
  hash: string;
  timestamp: number;
  winAmount?: number;
  userBetTotal?: number;
  outcome?: RoundOutcomeType;
}

export interface NumberBetMap {
  [sumNumber: number]: number;
}

export interface UserRoundRecord {
  roundNumber: number;
  totalBet: number;
  winAmount: number;
  netProfit: number;
  selectedNumbers: number[];
  rolledSum: number;
  timestamp: number;
}

export interface LeaderboardPlayer {
  rank: number;
  name: string;
  avatar: string;
  winAmount: number;
  badge: string;
}

export interface SoundSettings {
  master: boolean;
  betting: boolean;
  win: boolean;
  lose: boolean;
}
