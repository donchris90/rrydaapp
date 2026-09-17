import type { DiceRoundHistory } from '../types';

// Compute 3 digits (0-9) from SHA-256 hash
export function calculateDiceOutcome(hash: string): [number, number, number] {
  // Use sequential bytes from hex hash
  const b1 = parseInt(hash.substring(0, 2), 16);
  const b2 = parseInt(hash.substring(2, 4), 16);
  const b3 = parseInt(hash.substring(4, 6), 16);

  const d1 = b1 % 10;
  const d2 = b2 % 10;
  const d3 = b3 % 10;

  return [d1, d2, d3];
}

// Probability distribution count out of 1000 combinations (000 to 999)
export function getSumCombinationCount(sum: number): number {
  let count = 0;
  for (let i = 0; i <= 9; i++) {
    for (let j = 0; j <= 9; j++) {
      const k = sum - i - j;
      if (k >= 0 && k <= 9) {
        count++;
      }
    }
  }
  return count;
}

// Theoretical fair multiplier with standard 98.5% RTP
export function getTheoreticalMultiplier(sum: number): number {
  const combinations = getSumCombinationCount(sum);
  if (combinations === 0) return 0;
  // 98.5% RTP (1.5% house edge)
  const mult = (1000 / combinations) * 0.985;
  return Number(mult.toFixed(2));
}

// Simulated initial dice history
export function createInitialDiceHistory(): DiceRoundHistory[] {
  const history: DiceRoundHistory[] = [];
  const baseRound = 8920;

  for (let i = 0; i < 20; i++) {
    const roundNumber = baseRound - i;
    // Generate pseudo-deterministic or random outcome
    const d1 = Math.floor(Math.random() * 10);
    const d2 = Math.floor(Math.random() * 10);
    const d3 = Math.floor(Math.random() * 10);
    const sum = d1 + d2 + d3;
    const size = sum < 14 ? 'S' : 'B';
    const parity = sum % 2 === 0 ? 'E' : 'O';

    const hashChars = '0123456789abcdef';
    let hash = '';
    for (let h = 0; h < 64; h++) {
      hash += hashChars[Math.floor(Math.random() * hashChars.length)];
    }

    history.push({
      id: `dice-round-${roundNumber}`,
      roundNumber,
      dice: [d1, d2, d3],
      sum,
      size,
      parity,
      hash,
      serverSeed: hash.split('').reverse().join(''),
      clientSeed: 'rryda_fair_seed_lucky',
      nonce: roundNumber,
      timestamp: Date.now() - (i + 1) * 35000,
      totalPool: Math.floor(8000 + Math.random() * 15000),
      prize: Math.floor(sum * 250 + Math.random() * 2000),
    });
  }

  return history;
}
