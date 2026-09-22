export type RoundStatus = 'COUNTDOWN' | 'FLYING' | 'CRASHED';

export type BetMode = 'MANUAL' | 'AUTO';

export interface RoundHistoryItem {
  id: string;
  roundNumber: number;
  crashPoint: number;
  timestamp: number;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface PlayerBet {
  id: string;
  username: string;
  avatar: string;
  amount: number;
  autoCashOut?: number;
  cashedOutMultiplier?: number;
  cashedOutProfit?: number;
  status: 'IN_PLAY' | 'CASHED_OUT' | 'BUST';
  isUser?: boolean;
}

export interface AutoConfig {
  baseBet: number;
  autoCashOut: number;
  totalBets: number;
  remainingBets: number;
  onWinAction: 'RESET' | 'INCREASE';
  onWinPercent: number;
  onLossAction: 'RESET' | 'INCREASE';
  onLossPercent: number;
  stopProfit: number;
  stopLoss: number;
  initialBalance: number;
  running: boolean;
}

export interface TrendStats {
  totalRounds: number;
  underTwo: number;
  twoToTen: number;
  overTen: number;
  overHundred: number;
  highestMultiplier: number;
}

export type DiceRoundStatus = 'OPEN' | 'LOCKED' | 'RESOLVING' | 'SETTLED';

export interface DiceRoundHistory {
  id: string;
  roundNumber: number;
  dice: [number, number, number];
  sum: number;
  size: 'S' | 'B';
  parity: 'E' | 'O';
  hash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  timestamp: number;
  totalPool: number;
  prize?: number;
}

export interface DicePlayerBet {
  id: string;
  username: string;
  avatar: string;
  selection: number[];
  category?: 'S' | 'B' | 'E' | 'O' | 'CUSTOM';
  stakeAmount: number;
  won?: boolean;
  rewardAmount?: number;
  isUser?: boolean;
}

export type ActiveGame = 'CRASH' | 'SUM_DICE';

export type RoundResultType = 'WIN' | 'LOSS' | 'NOT_PLAYED';

export interface UserRoundRecord {
  id: string;
  roundNumber: number;
  game: 'CRASH' | 'SUM_DICE';
  resultType: RoundResultType;
  stake: number;
  multiplier?: number;
  outcomeDisplay: string;
  profit: number;
  timestamp: number;
}

export interface UserDashboardStats {
  totalRounds: number;
  wins: number;
  losses: number;
  notPlayed: number;
  winRate: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  bestMultiplier: number;
  currentStreak: {
    type: 'WIN' | 'LOSS' | 'NONE';
    count: number;
  };
}
