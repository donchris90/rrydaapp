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
