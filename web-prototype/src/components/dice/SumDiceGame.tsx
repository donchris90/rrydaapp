import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { DiceReels } from './DiceReels';
import { DiceBoard } from './DiceBoard';
import { DiceBettingBar } from './DiceBettingBar';
import { DiceHistoryModal } from './DiceHistoryModal';
import { FairnessModal } from '../FairnessModal';
import { HelpModal } from '../HelpModal';
import type { DiceRoundStatus, DiceRoundHistory, DicePlayerBet, UserRoundRecord } from '../../types';
import { createInitialDiceHistory, getTheoreticalMultiplier } from '../../utils/diceFairness';
import { audio } from '../../utils/audio';

interface SumDiceGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onOpenFairness?: () => void;
  onRecordResult?: (record: UserRoundRecord) => void;
}

const ALL_NUMBERS = Array.from({ length: 28 }, (_, i) => i);
const SMALL_NUMBERS = ALL_NUMBERS.filter((n) => n < 14);
const BIG_NUMBERS = ALL_NUMBERS.filter((n) => n >= 14);
const EVEN_NUMBERS = ALL_NUMBERS.filter((n) => n % 2 === 0);
const ODD_NUMBERS = ALL_NUMBERS.filter((n) => n % 2 !== 0);

export function SumDiceGame({ balance, onUpdateBalance, onRecordResult }: SumDiceGameProps) {
  // Round lifecycle state
  const [roundStatus, setRoundStatus] = useState<DiceRoundStatus>('OPEN');
  const [roundNumber, setRoundNumber] = useState<number>(8921);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(12);
  const [dice, setDice] = useState<[number, number, number]>([3, 5, 6]);
  const [lockedReels, setLockedReels] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [totalPool, setTotalPool] = useState<number>(12450);
  const [poolDistribution, setPoolDistribution] = useState<Record<number, number>>({});

  // Betting state
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [stakePerNumber, setStakePerNumber] = useState<number>(50);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [activeUserBet, setActiveUserBet] = useState<{ numbers: number[]; stake: number } | null>(null);

  // History & modals
  const [history, setHistory] = useState<DiceRoundHistory[]>(() => createInitialDiceHistory());
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isFairnessModalOpen, setIsFairnessModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Simulated active other bets
  const [liveBets, setLiveBets] = useState<DicePlayerBet[]>([]);

  // Sound ref for timer ticks
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize pool distribution
  useEffect(() => {
    const initialPool: Record<number, number> = {};
    ALL_NUMBERS.forEach((n) => {
      initialPool[n] = Math.floor(100 + Math.random() * 800);
    });
    setPoolDistribution(initialPool);
  }, [roundNumber]);

  // Round countdown and resolution engine
  useEffect(() => {
    if (roundStatus === 'OPEN') {
      if (countdownSeconds > 0) {
        timerRef.current = setTimeout(() => {
          setCountdownSeconds((s) => {
            const next = s - 1;
            if (next <= 3 && next > 0) {
              audio.playCountdownTick(false);
            } else if (next === 0) {
              audio.playCountdownTick(true);
            }
            return next;
          });
        }, 1000);
      } else {
        // Close bets and start rolling!
        startResolution();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [roundStatus, countdownSeconds]);

  // Start resolution sequence
  const startResolution = () => {
    setRoundStatus('RESOLVING');
    setLockedReels([false, false, false]);

    // Pre-determine outcome using pseudo-fair numbers
    const outcomeD1 = Math.floor(Math.random() * 10);
    const outcomeD2 = Math.floor(Math.random() * 10);
    const outcomeD3 = Math.floor(Math.random() * 10);
    const targetDice: [number, number, number] = [outcomeD1, outcomeD2, outcomeD3];
    const winningSum = outcomeD1 + outcomeD2 + outcomeD3;

    // Staggered reel locks:
    // Reel 1 locks after 1.5s
    setTimeout(() => {
      setDice((prev) => [targetDice[0], prev[1], prev[2]]);
      setLockedReels([true, false, false]);
      audio.playReelLock();
    }, 1500);

    // Reel 2 locks after 2.6s
    setTimeout(() => {
      setDice((prev) => [targetDice[0], targetDice[1], prev[2]]);
      setLockedReels([true, true, false]);
      audio.playReelLock();
    }, 2600);

    // Reel 3 locks after 3.7s -> Settle round
    setTimeout(() => {
      setDice(targetDice);
      setLockedReels([true, true, true]);
      setRoundStatus('SETTLED');
      audio.playReelLock();

      // Check if user won
      if (activeUserBet && activeUserBet.numbers.includes(winningSum)) {
        const mult = getTheoreticalMultiplier(winningSum);
        const winPayout = Math.floor(activeUserBet.stake * mult);
        onUpdateBalance(balance + winPayout);
        audio.playGrandWin();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFB800', '#00E701', '#FFFFFF'],
        });

        if (onRecordResult) {
          onRecordResult({
            id: `dice-rec-${roundNumber}-${Date.now()}`,
            roundNumber,
            game: 'SUM_DICE',
            resultType: 'WIN',
            stake: activeUserBet.stake,
            multiplier: mult,
            outcomeDisplay: `Hit Sum ${winningSum} (${winningSum < 14 ? 'Small' : 'Big'})`,
            profit: winPayout - activeUserBet.stake,
            timestamp: Date.now(),
          });
        }
      } else if (activeUserBet) {
        if (onRecordResult) {
          onRecordResult({
            id: `dice-rec-${roundNumber}-${Date.now()}`,
            roundNumber,
            game: 'SUM_DICE',
            resultType: 'LOSS',
            stake: activeUserBet.stake,
            multiplier: 0,
            outcomeDisplay: `Sum ${winningSum} (${winningSum < 14 ? 'Small' : 'Big'}) missed`,
            profit: -activeUserBet.stake,
            timestamp: Date.now(),
          });
        }
      } else {
        if (onRecordResult) {
          onRecordResult({
            id: `dice-rec-${roundNumber}-${Date.now()}`,
            roundNumber,
            game: 'SUM_DICE',
            resultType: 'NOT_PLAYED',
            stake: 0,
            multiplier: getTheoreticalMultiplier(winningSum),
            outcomeDisplay: `Spectated: Sum ${winningSum} (${winningSum < 14 ? 'Small' : 'Big'})`,
            profit: 0,
            timestamp: Date.now(),
          });
        }
      }

      // Add to history
      const hashChars = '0123456789abcdef';
      let roundHash = '';
      for (let h = 0; h < 64; h++) roundHash += hashChars[Math.floor(Math.random() * hashChars.length)];

      const newHistoryItem: DiceRoundHistory = {
        id: `dice-round-${roundNumber}`,
        roundNumber,
        dice: targetDice,
        sum: winningSum,
        size: winningSum < 14 ? 'S' : 'B',
        parity: winningSum % 2 === 0 ? 'E' : 'O',
        hash: roundHash,
        serverSeed: roundHash.split('').reverse().join(''),
        clientSeed: 'rryda_fair_seed_lucky',
        nonce: roundNumber,
        timestamp: Date.now(),
        totalPool,
        prize: Math.floor(winningSum * 250 + 800),
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 24)]);

      // After 4.5s of showing settlement, start next round
      setTimeout(() => {
        setRoundNumber((r) => r + 1);
        setRoundStatus('OPEN');
        setCountdownSeconds(14);
        setHasPlacedBet(false);
        setActiveUserBet(null);
        setSelectedNumbers(new Set());
        setTotalPool(Math.floor(9000 + Math.random() * 12000));
      }, 4500);
    }, 3700);
  };

  // Toggle single number selection
  const handleToggleNumber = (n: number) => {
    if (roundStatus !== 'OPEN') return;
    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  // Shortcut categories (Small, Big, Even, Odd)
  const handleApplyCategory = (cat: 'S' | 'B' | 'E' | 'O') => {
    if (roundStatus !== 'OPEN') return;
    const target =
      cat === 'S'
        ? SMALL_NUMBERS
        : cat === 'B'
        ? BIG_NUMBERS
        : cat === 'E'
        ? EVEN_NUMBERS
        : ODD_NUMBERS;

    setSelectedNumbers(new Set(target));
  };

  const handleClear = () => {
    if (roundStatus !== 'OPEN') return;
    setSelectedNumbers(new Set());
  };

  // Place Bet
  const handlePlaceBet = () => {
    if (roundStatus !== 'OPEN' || selectedNumbers.size === 0) return;
    const totalStake = stakePerNumber * selectedNumbers.size;
    if (balance < totalStake) return;

    onUpdateBalance(balance - totalStake);
    setHasPlacedBet(true);
    setActiveUserBet({
      numbers: Array.from(selectedNumbers),
      stake: stakePerNumber,
    });
    setTotalPool((p) => p + totalStake);

    // Update pool on the selected tiles
    setPoolDistribution((prev) => {
      const updated = { ...prev };
      selectedNumbers.forEach((n) => {
        updated[n] = (updated[n] || 0) + stakePerNumber;
      });
      return updated;
    });
  };

  // Compute recent streak string (e.g. "14B/E · 08S/E · 21B/O")
  const recentStreak = history
    .slice(0, 5)
    .map((h) => `${String(h.sum).padStart(2, '0')}${h.size}/${h.parity}`)
    .join(' · ');

  const currentWinningSum =
    roundStatus === 'SETTLED' && lockedReels.every(Boolean)
      ? dice[0] + dice[1] + dice[2]
      : null;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* 3D Dice Capsule & Animated Reels */}
      <DiceReels
        status={roundStatus}
        countdownSeconds={countdownSeconds}
        dice={dice}
        lockedReels={lockedReels}
        totalPool={totalPool}
        recentStreak={recentStreak}
      />

      {/* Interactive 28-Number Betting Grid */}
      <DiceBoard
        selectedNumbers={selectedNumbers}
        onToggleNumber={handleToggleNumber}
        onApplyCategory={handleApplyCategory}
        onClear={handleClear}
        winningSum={currentWinningSum}
        isOpen={roundStatus === 'OPEN'}
        poolDistribution={poolDistribution}
      />

      {/* Betting Controls Bar */}
      <DiceBettingBar
        stakePerNumber={stakePerNumber}
        onUpdateStake={setStakePerNumber}
        selectedCount={selectedNumbers.size}
        walletBalance={balance}
        isOpen={roundStatus === 'OPEN'}
        onPlaceBet={handlePlaceBet}
        hasPlacedBet={hasPlacedBet}
      />

      {/* Modals */}
      <DiceHistoryModal
        isOpen={isHistoryModalOpen}
        history={history}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <FairnessModal
        round={
          isFairnessModalOpen
            ? {
                id: `round-${roundNumber}`,
                roundNumber,
                crashPoint: 0,
                timestamp: Date.now(),
                hash: history[0]?.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                serverSeed: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
                clientSeed: 'rryda_fair_seed_lucky',
                nonce: roundNumber,
              }
            : null
        }
        onClose={() => setIsFairnessModalOpen(false)}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
