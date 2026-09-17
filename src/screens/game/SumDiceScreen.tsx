import React from 'react';
import { SumDiceGame } from '../../components/dice/SumDiceGame';

/**
 * SumDiceScreen (Lucky Number / Sum 0-27)
 * High-performance crypto-casino dice game with 3D reels, odds matrix, and provably fair engine.
 */
export function SumDiceScreen({
  balance = 5000,
  onUpdateBalance = () => {},
}: {
  balance?: number;
  onUpdateBalance?: (b: number) => void;
}) {
  return <SumDiceGame balance={balance} onUpdateBalance={onUpdateBalance} />;
}

export default SumDiceScreen;
