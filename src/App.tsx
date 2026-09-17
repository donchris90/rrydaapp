import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { CrashHeader } from './components/CrashHeader';
import { HistoryRibbon } from './components/HistoryRibbon';
import { CrashCanvas } from './components/CrashCanvas';
import { BettingControls } from './components/BettingControls';
import { LiveBetsTable } from './components/LiveBetsTable';
import { RoundLeaderboard } from './components/RoundLeaderboard';
import { FairnessModal } from './components/FairnessModal';
import { TrendsModal } from './components/TrendsModal';
import { HelpModal } from './components/HelpModal';
import { SumDiceGame } from './components/dice/SumDiceGame';
import { audio } from './utils/audio';
import {
  calculateCrashPoint,
  generateRandomHash,
  generateSeedPair,
  BOT_PLAYERS,
} from './utils/provablyFair';
import type {
  RoundStatus,
  RoundHistoryItem,
  PlayerBet,
  AutoConfig,
  ActiveGame,
} from './types';

// Generate 24 realistic initial history items
function createInitialHistory(): RoundHistoryItem[] {
  const items: RoundHistoryItem[] = [];
  const baseRound = 4830;
  for (let i = 0; i < 24; i++) {
    const hash = generateRandomHash();
    const crashPoint = calculateCrashPoint(hash);
    items.push({
      id: `round-${baseRound - i}`,
      roundNumber: baseRound - i,
      crashPoint,
      timestamp: Date.now() - (i + 1) * 20000,
      hash,
      serverSeed: generateRandomHash(),
      clientSeed: 'bc_community_seed_alpha',
      nonce: baseRound - i,
    });
  }
  return items;
}

export default function App() {
  // Game Selector ('SUM_DICE' or 'CRASH')
  const [activeGame, setActiveGame] = useState<ActiveGame>('SUM_DICE');

  // Game State (Crash)
  const [status, setStatus] = useState<RoundStatus>('COUNTDOWN');
  const [roundNumber, setRoundNumber] = useState<number>(4831);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(2.45);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(4.5);
  const [flightDurationMs, setFlightDurationMs] = useState<number>(0);

  // Provably Fair Data for Current Round
  const [currentSeedPair, setCurrentSeedPair] = useState(generateSeedPair);

  // Economy & Bets
  const [walletBalance, setWalletBalance] = useState<number>(5000.0);
  const [userBet, setUserBet] = useState<PlayerBet | null>(null);
  const [queuedBet, setQueuedBet] = useState<boolean>(false);
  const [queuedBetParams, setQueuedBetParams] = useState<{ amount: number; autoCashOut?: number } | null>(null);

  // Multi-Player Table & History
  const [players, setPlayers] = useState<PlayerBet[]>([]);
  const [myBetsHistory, setMyBetsHistory] = useState<PlayerBet[]>([]);
  const [history, setHistory] = useState<RoundHistoryItem[]>(createInitialHistory);

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedFairnessRound, setSelectedFairnessRound] = useState<RoundHistoryItem | null>(null);
  const [isTrendsOpen, setIsTrendsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Auto Bet Configuration
  const [autoConfig, setAutoConfig] = useState<AutoConfig>({
    baseBet: 100,
    autoCashOut: 2.0,
    totalBets: 10,
    remainingBets: 10,
    onWinAction: 'RESET',
    onWinPercent: 100,
    onLossAction: 'RESET',
    onLossPercent: 100,
    stopProfit: 10000,
    stopLoss: 0,
    initialBalance: 5000,
    running: false,
  });

  // Animation & Loop Refs
  const animLoopRef = useRef<number | null>(null);
  const flightStartTimeRef = useRef<number>(0);
  const countdownIntervalRef = useRef<number | null>(null);

  // Handle Cashout Triumph
  const triggerCashOutCelebration = useCallback((profit: number, multiplier: number) => {
    audio.playCashOut();
    if (multiplier >= 2.5) {
      try {
        confetti({
          particleCount: multiplier >= 10 ? 100 : 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E701', '#FFB800', '#22D3A5', '#FFFFFF'],
        });
      } catch {}
    }
  }, []);

  // Initialize Players for a New Round
  const setupRoundPlayers = useCallback(
    (includeUserParams?: { amount: number; autoCashOut?: number } | null) => {
      // Pick 8 to 14 random bots
      const count = Math.floor(Math.random() * 6) + 8;
      const shuffledBots = [...BOT_PLAYERS].sort(() => 0.5 - Math.random()).slice(0, count);

      const botBets: PlayerBet[] = shuffledBots.map((bot) => {
        const variance = (Math.random() - 0.5) * 0.4;
        const targetMultiplier = Math.max(1.1, Number((bot.risk + variance).toFixed(2)));
        const amount = Math.floor(bot.baseBet * (0.8 + Math.random() * 0.5));
        return {
          id: `bot-${bot.name}-${Date.now()}-${Math.random()}`,
          username: bot.name,
          avatar: bot.avatar,
          amount,
          autoCashOut: targetMultiplier,
          status: 'IN_PLAY',
          isUser: false,
        };
      });

      if (includeUserParams) {
        const uBet: PlayerBet = {
          id: `user-${Date.now()}`,
          username: 'You (VIP)',
          avatar: '👑',
          amount: includeUserParams.amount,
          autoCashOut: includeUserParams.autoCashOut,
          status: 'IN_PLAY',
          isUser: true,
        };
        botBets.unshift(uBet);
        setUserBet(uBet);
        setWalletBalance((b) => Math.max(0, b - includeUserParams.amount));
      } else {
        setUserBet(null);
      }

      setPlayers(botBets);
    },
    []
  );

  // Manual Cashout Action
  const handleCashOut = useCallback(() => {
    if (status !== 'FLYING' || !userBet || userBet.status !== 'IN_PLAY') return;

    const profit = Number((userBet.amount * currentMultiplier - userBet.amount).toFixed(2));
    const totalWon = Number((userBet.amount * currentMultiplier).toFixed(2));

    const updatedUserBet: PlayerBet = {
      ...userBet,
      status: 'CASHED_OUT',
      cashedOutMultiplier: currentMultiplier,
      cashedOutProfit: profit,
    };

    setUserBet(updatedUserBet);
    setWalletBalance((b) => Number((b + totalWon).toFixed(2)));
    setMyBetsHistory((prev) => [updatedUserBet, ...prev.slice(0, 49)]);

    setPlayers((prev) =>
      prev.map((p) => (p.isUser ? updatedUserBet : p))
    );

    triggerCashOutCelebration(profit, currentMultiplier);
  }, [status, userBet, currentMultiplier, triggerCashOutCelebration]);

  // Place Bet (Either for current countdown or queued for next round)
  const handlePlaceBet = (amount: number, autoCashOut?: number) => {
    if (amount <= 0 || amount > walletBalance) return;

    if (status === 'COUNTDOWN') {
      if (queuedBet) {
        // Unqueue
        setQueuedBet(false);
        setQueuedBetParams(null);
        setUserBet(null);
        setPlayers((prev) => prev.filter((p) => !p.isUser));
      } else {
        // Place bet in countdown
        setQueuedBet(true);
        setQueuedBetParams({ amount, autoCashOut });
        setupRoundPlayers({ amount, autoCashOut });
      }
    } else {
      // In flight or crashed: Queue for next round
      setQueuedBet(true);
      setQueuedBetParams({ amount, autoCashOut });
    }
  };

  const handleCancelQueuedBet = () => {
    setQueuedBet(false);
    setQueuedBetParams(null);
    if (status === 'COUNTDOWN' && userBet) {
      setWalletBalance((b) => b + userBet.amount);
      setUserBet(null);
      setPlayers((prev) => prev.filter((p) => !p.isUser));
    }
  };

  // Start Next Round (Countdown)
  const startNextRound = useCallback(() => {
    const nextSeed = generateSeedPair();
    const nextCrash = calculateCrashPoint(nextSeed.hash);

    setCurrentSeedPair(nextSeed);
    setCrashPoint(nextCrash);
    setStatus('COUNTDOWN');
    setCurrentMultiplier(1.0);
    setFlightDurationMs(0);
    setCountdownSeconds(4.0);

    // If auto bet is running or queued bet was set
    let betToSubmit = queuedBetParams;
    if (autoConfig.running && !betToSubmit) {
      betToSubmit = { amount: autoConfig.baseBet, autoCashOut: autoConfig.autoCashOut };
      setQueuedBet(true);
    }

    setupRoundPlayers(betToSubmit);

    // Start 4-second countdown
    let remaining = 4.0;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 0.1;
      setCountdownSeconds(Math.max(0, Number(remaining.toFixed(1))));

      if (remaining <= 3 && Math.abs(remaining - Math.round(remaining)) < 0.05) {
        audio.playCountdownTick(remaining <= 0.5);
      }

      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        launchRocket(nextCrash);
      }
    }, 100);
  }, [queuedBetParams, autoConfig, setupRoundPlayers]);

  // Launch Rocket Flight
  const launchRocket = (targetCrashPoint: number) => {
    setStatus('FLYING');
    setQueuedBet(false);
    setQueuedBetParams(null);
    audio.startFlightSound();

    const startTime = performance.now();
    flightStartTimeRef.current = startTime;

    const tick = (now: number) => {
      const elapsedMs = now - startTime;
      setFlightDurationMs(elapsedMs);

      // Exponential climbing formula: m(t) = 1.00 + (t/1000)^1.8 * 0.08
      const elapsedSec = elapsedMs / 1000;
      const calculatedMultiplier = Number((1.0 + Math.pow(elapsedSec, 1.7) * 0.065).toFixed(2));

      audio.updateFlightPitch(calculatedMultiplier);

      // Check if rocket crashed
      if (calculatedMultiplier >= targetCrashPoint) {
        handleCrash(targetCrashPoint, elapsedMs);
        return;
      }

      setCurrentMultiplier(calculatedMultiplier);

      // Check auto-cashout for user
      setUserBet((currUserBet) => {
        if (
          currUserBet &&
          currUserBet.status === 'IN_PLAY' &&
          currUserBet.autoCashOut &&
          calculatedMultiplier >= currUserBet.autoCashOut
        ) {
          const profit = Number((currUserBet.amount * currUserBet.autoCashOut - currUserBet.amount).toFixed(2));
          const totalWon = Number((currUserBet.amount * currUserBet.autoCashOut).toFixed(2));
          setWalletBalance((b) => Number((b + totalWon).toFixed(2)));

          const updated: PlayerBet = {
            ...currUserBet,
            status: 'CASHED_OUT',
            cashedOutMultiplier: currUserBet.autoCashOut,
            cashedOutProfit: profit,
          };

          setMyBetsHistory((prev) => [updated, ...prev.slice(0, 49)]);
          triggerCashOutCelebration(profit, currUserBet.autoCashOut);
          return updated;
        }
        return currUserBet;
      });

      // Check bot cashouts
      setPlayers((prev) =>
        prev.map((player) => {
          if (
            !player.isUser &&
            player.status === 'IN_PLAY' &&
            player.autoCashOut &&
            calculatedMultiplier >= player.autoCashOut
          ) {
            const profit = Number((player.amount * player.autoCashOut - player.amount).toFixed(2));
            return {
              ...player,
              status: 'CASHED_OUT',
              cashedOutMultiplier: player.autoCashOut,
              cashedOutProfit: profit,
            };
          }
          return player;
        })
      );

      animLoopRef.current = requestAnimationFrame(tick);
    };

    animLoopRef.current = requestAnimationFrame(tick);
  };

  // Handle Rocket Crash
  const handleCrash = (finalMultiplier: number, durationMs: number) => {
    if (animLoopRef.current) cancelAnimationFrame(animLoopRef.current);
    setStatus('CRASHED');
    setCurrentMultiplier(finalMultiplier);
    audio.playCrash();

    // Mark remaining in-play players as BUST
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.status === 'IN_PLAY') {
          return { ...p, status: 'BUST' };
        }
        return p;
      })
    );

    setUserBet((u) => {
      if (u && u.status === 'IN_PLAY') {
        const busted: PlayerBet = { ...u, status: 'BUST' };
        setMyBetsHistory((prev) => [busted, ...prev.slice(0, 49)]);
        return busted;
      }
      return u;
    });

    // Record into History
    const historyItem: RoundHistoryItem = {
      id: `round-${roundNumber}`,
      roundNumber,
      crashPoint: finalMultiplier,
      timestamp: Date.now(),
      hash: currentSeedPair.hash,
      serverSeed: currentSeedPair.serverSeed,
      clientSeed: currentSeedPair.clientSeed,
      nonce: roundNumber,
    };

    setHistory((prev) => [historyItem, ...prev.slice(0, 49)]);
    setRoundNumber((r) => r + 1);

    // Auto bet logic progression
    if (autoConfig.running) {
      const remaining = autoConfig.remainingBets - 1;
      if (remaining <= 0) {
        setAutoConfig((c) => ({ ...c, running: false, remainingBets: 0 }));
      } else {
        setAutoConfig((c) => ({ ...c, remainingBets: remaining }));
      }
    }

    // Prepare next round after 3 seconds
    setTimeout(() => {
      startNextRound();
    }, 3200);
  };

  // Initial Start
  useEffect(() => {
    startNextRound();
    return () => {
      if (animLoopRef.current) cancelAnimationFrame(animLoopRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      audio.stopFlightSound();
    };
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTrendsOpen(false);
        setSelectedFairnessRound(null);
        setIsHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Free Coins Faucet
  const handleResetBalance = () => {
    audio.playClick();
    setWalletBalance((b) => b + 1000);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const handleToggleAutoRun = () => {
    audio.playClick();
    if (autoConfig.running) {
      setAutoConfig((c) => ({ ...c, running: false }));
    } else {
      setAutoConfig((c) => ({
        ...c,
        running: true,
        remainingBets: c.totalBets,
        initialBalance: walletBalance,
      }));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#181F2A] text-white flex flex-col font-sans selection:bg-[#00E701] selection:text-black">
      {/* BC.Game Top Header */}
      <CrashHeader
        roundNumber={activeGame === 'CRASH' ? roundNumber : undefined}
        walletBalance={walletBalance}
        isMuted={isMuted}
        activeGame={activeGame}
        onSelectGame={setActiveGame}
        onToggleMute={handleToggleMute}
        onResetBalance={handleResetBalance}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenFairness={() =>
          setSelectedFairnessRound(
            history[0] || {
              id: `round-${roundNumber}`,
              roundNumber,
              crashPoint,
              timestamp: Date.now(),
              hash: currentSeedPair.hash,
              serverSeed: currentSeedPair.serverSeed,
              clientSeed: currentSeedPair.clientSeed,
              nonce: roundNumber,
            }
          )
        }
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col gap-4">
        {activeGame === 'SUM_DICE' ? (
          <SumDiceGame
            balance={walletBalance}
            onUpdateBalance={setWalletBalance}
          />
        ) : (
          <>
            {/* Horizontal Multipliers Ribbon */}
            <HistoryRibbon
              history={history}
              onSelectRound={(item) => setSelectedFairnessRound(item)}
              onOpenTrends={() => setIsTrendsOpen(true)}
            />

            {/* Primary Stage: Split Layout on Desktop / Stacked on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Betting Controls (LG: 5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
                <BettingControls
                  status={status}
                  currentMultiplier={currentMultiplier}
                  walletBalance={walletBalance}
                  userBet={userBet}
                  queuedBet={queuedBet}
                  onPlaceBet={handlePlaceBet}
                  onCancelQueuedBet={handleCancelQueuedBet}
                  onCashOut={handleCashOut}
                  autoConfig={autoConfig}
                  onUpdateAutoConfig={(cfg) => setAutoConfig((prev) => ({ ...prev, ...cfg }))}
                  onToggleAutoRun={handleToggleAutoRun}
                />

                {/* Top 3 Profit Round Leaderboard */}
                <RoundLeaderboard
                  players={players}
                  status={status}
                  currentMultiplier={currentMultiplier}
                  roundNumber={roundNumber}
                />

                {/* Live Multiplayer Lobby Bets Table */}
                <LiveBetsTable
                  status={status}
                  currentMultiplier={currentMultiplier}
                  players={players}
                  myBets={myBetsHistory}
                />
              </div>

              {/* Right Column: HTML5 60FPS Flight Canvas (LG: 7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4 order-1 lg:order-2">
                <CrashCanvas
                  status={status}
                  currentMultiplier={currentMultiplier}
                  crashPoint={crashPoint}
                  countdownSeconds={countdownSeconds}
                  flightDurationMs={flightDurationMs}
                />

                {/* Quick Live Game Stats Bar */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="p-3 rounded-xl bg-[#242D3D] border border-white/10 flex flex-col items-center sm:items-start shadow-sm">
                    <span className="text-[10px] sm:text-xs uppercase font-bold text-white/50 tracking-wider">
                      House Edge
                    </span>
                    <span className="text-sm sm:text-base font-mono font-black text-[#00E701]">
                      1.00% (99% RTP)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#242D3D] border border-white/10 flex flex-col items-center sm:items-start shadow-sm">
                    <span className="text-[10px] sm:text-xs uppercase font-bold text-white/50 tracking-wider">
                      Active Bettors
                    </span>
                    <span className="text-sm sm:text-base font-mono font-black text-white">
                      {players.length} Players
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#242D3D] border border-white/10 flex flex-col items-center sm:items-start shadow-sm">
                    <span className="text-[10px] sm:text-xs uppercase font-bold text-white/50 tracking-wider">
                      Server Seed Hash
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-white/80 truncate w-full">
                      {currentSeedPair.hash.substring(0, 10)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <FairnessModal
        round={selectedFairnessRound}
        onClose={() => setSelectedFairnessRound(null)}
      />

      <TrendsModal
        isOpen={isTrendsOpen}
        history={history}
        onClose={() => setIsTrendsOpen(false)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
