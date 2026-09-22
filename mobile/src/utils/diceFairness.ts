import type { DiceRoundHistory, QuickBetType } from '../components/dice/luckyNumberTypes';

// Compute combination counts of 3 digits (each 0-9) that sum to `sum` (range 0..27).
// Total combinations = 10 x 10 x 10 = 1000.
export function getSumCombinationCount(sum: number): number {
  if (sum < 0 || sum > 27) return 0;
  let count = 0;
  for (let d1 = 0; d1 <= 9; d1++) {
    for (let d2 = 0; d2 <= 9; d2++) {
      const d3 = sum - d1 - d2;
      if (d3 >= 0 && d3 <= 9) {
        count++;
      }
    }
  }
  return count;
}

// Proportional bet distribution across the 14 numbers in a quick-bet category,
// exactly matching Poppo Live's bell-curve distribution seen in real play!
export function getCategoryDistribution(
  category: 'S' | 'B' | 'E' | 'O',
  totalBet: number
): Record<number, number> {
  const result: Record<number, number> = {};
  const targetNumbers: number[] = [];

  for (let n = 0; n <= 27; n++) {
    if (category === 'S' && n <= 13) targetNumbers.push(n);
    else if (category === 'B' && n >= 14) targetNumbers.push(n);
    else if (category === 'E' && n % 2 === 0) targetNumbers.push(n);
    else if (category === 'O' && n % 2 !== 0) targetNumbers.push(n);
  }

  // Total combinations across the target category = 500
  const categoryTotalCombos = 500;
  let allocated = 0;
  const allocations: { num: number; amount: number; fraction: number }[] = [];

  for (const num of targetNumbers) {
    const combos = getSumCombinationCount(num);
    const rawAmount = (totalBet * combos) / categoryTotalCombos;
    let rounded = Math.round(rawAmount);
    // Ensure at least 1 or 0
    if (rounded < 1 && totalBet >= targetNumbers.length) rounded = 1;
    allocations.push({
      num,
      amount: rounded,
      fraction: rawAmount - Math.floor(rawAmount),
    });
    allocated += rounded;
  }

  // Balance rounding difference so sum equals totalBet exactly
  let diff = totalBet - allocated;
  if (diff !== 0) {
    // Distribute diff to highest combinations (like sum 13 or 14)
    const sorted = [...allocations].sort((a, b) => b.fraction - a.fraction);
    for (let i = 0; i < Math.abs(diff) && i < sorted.length; i++) {
      if (diff > 0) {
        sorted[i].amount += 1;
      } else if (sorted[i].amount > 1) {
        sorted[i].amount -= 1;
      }
    }
  }

  for (const item of allocations) {
    result[item.num] = item.amount;
  }

  return result;
}
