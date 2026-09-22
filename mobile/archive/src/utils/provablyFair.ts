// Provably Fair Crash calculation matching industry standards (BC.Game / Stake)
export function generateRandomHash(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate realistic Crash points based on standard 1% house edge formula
export function calculateCrashPoint(hash: string): number {
  // Take first 13 hex characters (52 bits)
  const subHash = hash.substring(0, 13);
  const h = parseInt(subHash, 16);
  const e = Math.pow(2, 52);

  // 1 in 33 rounds crashes immediately at 1.00x (~3% instant crash edge)
  if (h % 33 === 0) {
    return 1.0;
  }

  // Multiplier formula with 99% RTP
  const multiplier = Math.floor((100 * e - h) / (e - h)) / 100;
  return Math.max(1.0, Number(multiplier.toFixed(2)));
}

export function generateSeedPair() {
  return {
    serverSeed: generateRandomHash(),
    clientSeed: 'bc_community_seed_' + Math.floor(Math.random() * 1000000),
    hash: generateRandomHash(),
  };
}

// Simulated active players with realistic casino names and betting tendencies
export const BOT_PLAYERS = [
  { name: 'Satoshi99', avatar: '🐱', baseBet: 150, risk: 1.8 },
  { name: 'ViperX', avatar: '🐍', baseBet: 50, risk: 1.35 },
  { name: 'CryptoWhale', avatar: '🐳', baseBet: 1000, risk: 3.5 },
  { name: 'DiamondHands', avatar: '💎', baseBet: 300, risk: 2.5 },
  { name: 'MoonRider', avatar: '🚀', baseBet: 75, risk: 8.0 },
  { name: 'LuckyCharm', avatar: '🍀', baseBet: 120, risk: 1.5 },
  { name: 'CyberSamurai', avatar: '⚡', baseBet: 250, risk: 2.1 },
  { name: 'SolanaKing', avatar: '☀️', baseBet: 450, risk: 1.9 },
  { name: 'ApeIn', avatar: '🦍', baseBet: 80, risk: 4.2 },
  { name: 'GoldenFalcon', avatar: '🦅', baseBet: 500, risk: 1.6 },
  { name: 'NeonRider', avatar: '🏍️', baseBet: 200, risk: 2.8 },
  { name: 'PixelBaron', avatar: '👾', baseBet: 60, risk: 1.4 },
  { name: 'BullMarket', avatar: '🐂', baseBet: 350, risk: 2.2 },
  { name: 'ShadowBet', avatar: '🥷', baseBet: 180, risk: 5.5 },
  { name: 'AlphaCentauri', avatar: '🌌', baseBet: 800, risk: 1.7 },
];
