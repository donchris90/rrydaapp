import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Animated } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { colors } from './luckyNumberTheme';
import { DiceHeader } from './DiceHeader';
import { DiceReels } from './DiceReels';
import { DiceStatusBar } from './DiceStatusBar';
import { DiceTrendRow } from './DiceTrendRow';
import { DiceBoard } from './DiceBoard';
import { DiceBettingBar } from './DiceBettingBar';
import { DiceHistoryModal } from './DiceHistoryModal';
import { DiceHelpModal } from './DiceHelpModal';
import { DiceLeaderboardModal } from './DiceLeaderboardModal';
import { DiceResultBoard } from './DiceResultBoard';
import { DiceStreakBadge } from './DiceStreakBadge';
import { DiceSoundSettingsModal } from './DiceSoundSettingsModal';
import { DiceGameHistory } from './DiceGameHistory';
import type {
  DiceRoundStatus,
  DiceRoundHistory,
  QuickBetType,
  NumberBetMap,
  UserRoundRecord,
  RoundResultSummary,
  RoundOutcomeType,
  SoundSettings,
} from './luckyNumberTypes';
import { getCategoryDistribution } from '../../utils/diceFairness';
import {
  DEFAULT_SOUND_SETTINGS,
  playBetSound,
  playWinSound,
  playLoseSound,
  onLoseSound,
} from '../../utils/diceAudio';
import {
  fetchRounds,
  fetchMyEntries,
  fetchHistory,
  placeEntry,
  type GameRound,
} from '../../api/games';

const GAME_CODE = 'SUM_DICE';

interface SumDiceGameProps {
  balance?: number;
  // Kept for backward compatibility with mobile/src/App.tsx — a separate,
  // web-only (canvas-confetti, <div>/<main> DOM markup) duplicate of this
  // whole game, unreachable from the real React Native navigation graph
  // (see the audit's duplicate-code section). No longer used by this
  // component itself: wallet updates now happen for real, server-side,
  // and this file invalidates the shared `wallet` query on success
  // instead of asking a parent to track balance in local state.
  onUpdateBalance?: (newBalance: number) => void;
  onClose?: () => void;
  onRecordResult?: (record: UserRoundRecord) => void;
  previewResultOutcome?: RoundOutcomeType | null;
  onClearPreviewOutcome?: () => void;
}

// ---------------------------------------------------------------------
// This component previously ran an entirely local simulation: dice were
// rolled with Math.random() on-device, payouts used a probability-weighted
// "98.5% RTP" multiplier (getTheoreticalMultiplier) that has never matched
// the real backend's economics (a single flat payoutMultiplier from
// GameDefinition.rulesJson — 9x for every number, see prisma/seed.ts and
// games/sum-dice-rules.ts's computeSumDiceReward), and balance was updated
// only in local React state via a prop from SumDiceScreen that itself
// defaulted to a hardcoded 403029 and was never fed a real value by
// navigation. fetchRounds/placeEntry/fetchMyEntries were never called.
//
// The backend deliberately never exposes the payout multiplier ahead of
// settlement (see games.controller.ts's myEntries() comment: recomputing
// it client-side "would drift" the moment an admin changes rulesJson) — so
// this rewrite does not show a pre-bet "potential payout" figure. It shows
// the real amount only once the round is actually settled, from the real
// GameEntry.rewardAmount.
// ---------------------------------------------------------------------

export function SumDiceGame({
  balance = 0,
  onClose,
  onRecordResult = () => {},
  previewResultOutcome = null,
  onClearPreviewOutcome = () => {},
}: SumDiceGameProps) {
  const queryClient = useQueryClient();

  // Betting State — still fully local until confirmed, exactly as before.
  const [currentChip, setCurrentChip] = useState<number>(9336);
  const [bets, setBets] = useState<NumberBetMap>(() => getCategoryDistribution('E', 928));
  const [activeCategory, setActiveCategory] = useState<QuickBetType>('E');

  // Cosmetic-only slot-reel digits while waiting on settlement — these are
  // NOT the game result, just a spinning animation. The real result comes
  // from displayRound.result once status is SETTLED (see below).
  const [dice, setDice] = useState<[number, number, number]>([0, 0, 0]);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);

  // Result Board State
  const [showResultBoard, setShowResultBoard] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResultSummary | null>(null);
  const [settledCountdown, setSettledCountdown] = useState<number>(5);

  // Win streak — session-only, incremented strictly from real observed
  // settlement outcomes below (never seeded with a fake starting value,
  // unlike the old winStreak=3/bestStreak=5 defaults). A persisted,
  // cross-session streak would need a new backend field; out of scope here.
  const [winStreak, setWinStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [isStreakGlowing, setIsStreakGlowing] = useState<boolean>(false);

  // Modals
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('rryda_dice_sound_settings');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return DEFAULT_SOUND_SETTINGS;
  });

  const handleUpdateSoundSettings = useCallback((newSettings: SoundSettings) => {
    setSoundSettings(newSettings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rryda_dice_sound_settings', JSON.stringify(newSettings));
      } catch {}
    }
  }, []);

  // Screen-Shake Animation for tactile Lose feedback — unchanged.
  const shakeAnimX = useRef(new Animated.Value(0)).current;
  const shakeAnimY = useRef(new Animated.Value(0)).current;
  const loseFlashAnim = useRef(new Animated.Value(0)).current;

  const triggerScreenShake = useCallback(() => {
    shakeAnimX.setValue(0);
    shakeAnimY.setValue(0);
    loseFlashAnim.setValue(1);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(shakeAnimX, { toValue: -12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnimX, { toValue: 12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnimX, { toValue: -9, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnimX, { toValue: 9, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnimX, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimX, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimX, { toValue: -2, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnimX, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(shakeAnimY, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnimY, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnimY, { toValue: 5, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnimY, { toValue: -5, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnimY, { toValue: 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimY, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
      Animated.timing(loseFlashAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [shakeAnimX, shakeAnimY, loseFlashAnim]);

  useEffect(() => {
    const unsubscribe = onLoseSound(triggerScreenShake);
    return () => unsubscribe();
  }, [triggerScreenShake]);

  // ---------------------------------------------------------------------
  // Real round lifecycle. Rounds are created/opened/locked/settled by the
  // server's own scheduler (RoundService/SettlementService) — nothing
  // here decides a dice roll or a payout.
  // ---------------------------------------------------------------------
  const roundsQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'rounds'],
    queryFn: () => fetchRounds(GAME_CODE),
    refetchInterval: 3000,
  });
  const rounds = roundsQuery.data ?? [];
  const settledRounds = rounds.filter((r) => r.status === 'SETTLED');
  // The round currently relevant to show: whichever is open/in-flight, or
  // else the most recently settled one (so a just-finished round's result
  // is still readable for a few seconds after it settles).
  const displayRound: GameRound | null =
    rounds.find((r) => r.status === 'OPEN' || r.status === 'LOCKED' || r.status === 'RESOLVING') ??
    settledRounds[0] ??
    null;

  const roundStatus: DiceRoundStatus =
    displayRound?.status === 'OPEN' ? 'OPEN' : displayRound?.status === 'SETTLED' ? 'SETTLED' : 'ROLLING';

  const myEntriesQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'myEntries', displayRound?.id],
    queryFn: () => fetchMyEntries(displayRound!.id),
    enabled: !!displayRound,
    refetchInterval: displayRound && displayRound.status !== 'OPEN' ? 1500 : false,
  });
  const myEntry = myEntriesQuery.data?.[0] ?? null;
  const hasPlacedBet = !!myEntry;

  const historyQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'history'],
    queryFn: () => fetchHistory(GAME_CODE),
    refetchInterval: 8000,
  });

  // Real settled-round history, replacing createInitialDiceHistory()'s
  // fake seed data. Per-round "my bet"/"my outcome" fields are left
  // undefined for rounds other than the one just played (DiceRoundHistory
  // declares both as optional) rather than invented — a full per-round
  // personal history would need one fetchMyEntries call per historical
  // round, which isn't built here.
  const history: DiceRoundHistory[] = useMemo(() => {
    const rows = historyQuery.data ?? [];
    return rows.map((row, index) => {
      const sum = row.result?.sum ?? 0;
      const isMine = displayRound?.status === 'SETTLED' && row.roundId === displayRound.id && myEntry;
      return {
        id: row.roundId,
        // Real rounds have no sequential number — this is a display
        // ordinal (most-recent = highest), not a persistent round id.
        // The real identifier is `id` above.
        roundNumber: rows.length - index,
        dice: (row.result?.dice as [number, number, number] | undefined) ?? [0, 0, 0],
        sum,
        isSmall: sum <= 13,
        isEven: sum % 2 === 0,
        hash: row.roundId.slice(0, 12),
        timestamp: row.settledAt ? new Date(row.settledAt).getTime() : Date.now(),
        userBetTotal: isMine ? myEntry!.coinAmount : undefined,
        winAmount: isMine ? myEntry!.rewardAmount : undefined,
        outcome: isMine ? (myEntry!.status === 'WON' ? 'WIN' : 'LOSE') : undefined,
      };
    });
  }, [historyQuery.data, displayRound?.id, displayRound?.status, myEntry]);

  const trendLabel = useMemo(() => {
    const recent = history.slice(0, 3);
    const sCount = recent.filter((r) => r.isSmall).length;
    const eCount = recent.filter((r) => r.isEven).length;
    return `${sCount}S/${eCount}E`;
  }, [history]);

  const totalBet = Object.values(bets).reduce((acc, curr) => acc + curr, 0);

  const countdownSeconds = displayRound && roundStatus === 'OPEN'
    ? Math.max(0, Math.round((new Date(displayRound.lockAt).getTime() - Date.now()) / 1000))
    : 0;

  // Redraw the OPEN countdown against the round's real, server-set lockAt.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (roundStatus !== 'OPEN') return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [roundStatus]);

  // Cosmetic slot-reel spin while LOCKED/RESOLVING (i.e. bets are closed
  // and we're waiting on the server to settle) — this never determines
  // the actual outcome, it just gives the "rolling" moment something to
  // show. The real dice are set from displayRound.result once SETTLED,
  // in the settlement effect below, overwriting whatever was spinning.
  useEffect(() => {
    if (roundStatus !== 'ROLLING') return;
    const id = setInterval(() => {
      setDice([Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]);
    }, 120);
    return () => clearInterval(id);
  }, [roundStatus]);

  // Clear the bet slate once a genuinely new round opens.
  const lastOpenRoundIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (roundStatus === 'OPEN' && displayRound && lastOpenRoundIdRef.current !== displayRound.id) {
      lastOpenRoundIdRef.current = displayRound.id;
      setActiveCategory('E');
      setBets(getCategoryDistribution('E', 928));
      setWinningNumber(null);
    }
  }, [roundStatus, displayRound?.id]);

  // Fires exactly once per newly-settled round: reveals the real dice,
  // shows the real result (win/lose/not-played) from the real GameEntry,
  // and updates the session win-streak from a real observed outcome.
  const shownResultForRoundIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!displayRound || displayRound.status !== 'SETTLED' || !displayRound.result) return;
    if (shownResultForRoundIdRef.current === displayRound.id) return;
    // Wait for the my-entries fetch for this settled round to resolve
    // before deciding WIN/LOSE/NOT_PLAYED, so a real win isn't briefly
    // misreported as NOT_PLAYED while the query is still in flight.
    if (myEntriesQuery.isLoading) return;
    shownResultForRoundIdRef.current = displayRound.id;

    const sum = displayRound.result.sum ?? 0;
    const diceArr = (displayRound.result.dice as [number, number, number] | undefined) ?? [0, 0, 0];
    const outcome: RoundOutcomeType = myEntry?.status === 'WON' ? 'WIN' : myEntry?.status === 'LOST' ? 'LOSE' : 'NOT_PLAYED';

    setDice(diceArr);
    setWinningNumber(sum);

    if (outcome === 'WIN') {
      playWinSound(soundSettings);
      setWinStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      setIsStreakGlowing(true);
      setTimeout(() => setIsStreakGlowing(false), 3500);
    } else if (outcome === 'LOSE') {
      playLoseSound(soundSettings);
      setWinStreak(0);
    }

    const payout = myEntry?.rewardAmount ?? 0;
    const staked = myEntry?.coinAmount ?? 0;

    setLastRoundResult({
      outcome,
      roundNumber: history.length + 1,
      dice: diceArr,
      sum,
      isSmall: sum <= 13,
      isEven: sum % 2 === 0,
      betAmount: staked,
      payoutAmount: payout,
      netProfit: payout - staked,
      // Derived from the real settled reward, never a client-guessed
      // multiplier — see this file's header comment for why.
      multiplier: staked > 0 ? Number((payout / staked).toFixed(2)) : 0,
      selectedNumbers: myEntry?.selection ?? [],
    });
    setSettledCountdown(5);
    setShowResultBoard(true);

    onRecordResult({
      roundNumber: history.length + 1,
      totalBet: staked,
      winAmount: payout,
      netProfit: payout - staked,
      selectedNumbers: myEntry?.selection ?? [],
      rolledSum: sum,
      timestamp: Date.now(),
    });

    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['games', GAME_CODE, 'history'] });
  }, [displayRound, myEntry, myEntriesQuery.isLoading, soundSettings, history.length, onRecordResult, queryClient]);

  // Auto-dismiss the result celebration after a few seconds — the next
  // round appearing is driven entirely by roundsQuery's poll, not by any
  // local "advance round" logic.
  useEffect(() => {
    if (!showResultBoard) return;
    const countdownId = setInterval(() => setSettledCountdown((c) => Math.max(0, c - 1)), 1000);
    const closeTimer = setTimeout(() => setShowResultBoard(false), 5000);
    return () => {
      clearInterval(countdownId);
      clearTimeout(closeTimer);
    };
  }, [showResultBoard]);

  // Preview harness (unchanged) — lets a developer trigger the WIN/LOSE/
  // NOT_PLAYED board without a real bet, for visual QA.
  useEffect(() => {
    if (!previewResultOutcome) return;
    setLastRoundResult({
      outcome: previewResultOutcome,
      roundNumber: history.length + 1,
      dice: [3, 5, 6],
      sum: 14,
      isSmall: false,
      isEven: true,
      betAmount: previewResultOutcome === 'NOT_PLAYED' ? 0 : 928,
      payoutAmount: previewResultOutcome === 'WIN' ? 8352 : 0,
      netProfit: previewResultOutcome === 'WIN' ? 7424 : previewResultOutcome === 'LOSE' ? -928 : 0,
      multiplier: previewResultOutcome === 'WIN' ? 9 : 0,
      selectedNumbers: previewResultOutcome === 'NOT_PLAYED' ? [] : [14],
    });
    setSettledCountdown(5);
    setShowResultBoard(true);
  }, [previewResultOutcome, history.length]);

  // ---------------------------------------------------------------------
  // Betting handlers — build up the local `bets` map exactly as before;
  // only the final submit (handleConfirmBet) now calls the real backend.
  // ---------------------------------------------------------------------
  const handleSelectCategory = useCallback(
    (category: 'S' | 'B' | 'E' | 'O') => {
      if (roundStatus !== 'OPEN' || hasPlacedBet) return;
      playBetSound(soundSettings);
      if (activeCategory === category) {
        setActiveCategory(null);
        setBets({});
      } else {
        setActiveCategory(category);
        const targetBet = totalBet > 0 ? totalBet : 928;
        setBets(getCategoryDistribution(category, targetBet));
      }
    },
    [roundStatus, hasPlacedBet, activeCategory, totalBet, soundSettings],
  );

  const handleToggleNumberBet = useCallback(
    (num: number) => {
      if (roundStatus !== 'OPEN' || hasPlacedBet) return;
      playBetSound(soundSettings);
      setActiveCategory(null);
      setBets((prev) => {
        const next = { ...prev };
        next[num] = next[num] ? next[num] + currentChip : currentChip;
        return next;
      });
    },
    [roundStatus, hasPlacedBet, currentChip, soundSettings],
  );

  const handleIncreaseBet = useCallback(() => {
    if (roundStatus !== 'OPEN' || hasPlacedBet) return;
    playBetSound(soundSettings);
    if (activeCategory) {
      setBets(getCategoryDistribution(activeCategory, totalBet + 100));
    } else {
      setBets((prev) => {
        const next: NumberBetMap = {};
        for (const [k, v] of Object.entries(prev)) next[Number(k)] = Math.round(v * 1.25);
        return next;
      });
    }
  }, [roundStatus, hasPlacedBet, activeCategory, totalBet, soundSettings]);

  const handleDecreaseBet = useCallback(() => {
    if (roundStatus !== 'OPEN' || hasPlacedBet || totalBet <= 100) return;
    playBetSound(soundSettings);
    if (activeCategory) {
      setBets(getCategoryDistribution(activeCategory, Math.max(100, totalBet - 100)));
    } else {
      setBets((prev) => {
        const next: NumberBetMap = {};
        for (const [k, v] of Object.entries(prev)) next[Number(k)] = Math.max(1, Math.round(v * 0.8));
        return next;
      });
    }
  }, [roundStatus, hasPlacedBet, activeCategory, totalBet, soundSettings]);

  const handleClearBets = useCallback(() => {
    if (roundStatus !== 'OPEN' || hasPlacedBet) return;
    setBets({});
    setActiveCategory(null);
  }, [roundStatus, hasPlacedBet]);

  const handleDoubleBets = useCallback(() => {
    if (roundStatus !== 'OPEN' || hasPlacedBet || totalBet * 2 > balance) return;
    playBetSound(soundSettings);
    if (activeCategory) {
      setBets(getCategoryDistribution(activeCategory, totalBet * 2));
    } else {
      setBets((prev) => {
        const next: NumberBetMap = {};
        for (const [k, v] of Object.entries(prev)) next[Number(k)] = v * 2;
        return next;
      });
    }
  }, [roundStatus, hasPlacedBet, totalBet, balance, activeCategory, soundSettings]);

  const placeMutation = useMutation({
    mutationFn: () => {
      if (!displayRound) throw new Error('No round is open for entries right now');
      const selection = Object.keys(bets).map(Number);
      return placeEntry(displayRound.id, {
        selection,
        stakeAmount: totalBet,
        idempotencyKey: Crypto.randomUUID(),
      });
    },
    onSuccess: () => {
      playBetSound(soundSettings);
      queryClient.invalidateQueries({ queryKey: ['games', GAME_CODE, 'myEntries', displayRound?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      Alert.alert('Could not place bet', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleConfirmBet = useCallback(() => {
    if (roundStatus !== 'OPEN' || hasPlacedBet || totalBet <= 0 || totalBet > balance || !displayRound) return;
    placeMutation.mutate();
  }, [roundStatus, hasPlacedBet, totalBet, balance, displayRound, placeMutation]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: shakeAnimX },
            { translateY: shakeAnimY },
          ],
        },
      ]}
    >
      {/* Background Vortex Spiral Effect */}
      <View pointerEvents="none" style={styles.vortexBackground}>
        <View style={styles.vortexRing1} />
        <View style={styles.vortexRing2} />
        <View style={styles.vortexRing3} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with 3D Bubble Title "LUCKY NUMBER!" */}
        <DiceHeader
          onClose={onClose}
          soundSettings={soundSettings}
          onOpenSoundSettings={() => setShowSoundSettings(true)}
        />

        {/* Win Streak Tracker Badge with Celebratory Glow Effect */}
        <DiceStreakBadge
          streak={winStreak}
          bestStreak={bestStreak}
          isGlowing={isStreakGlowing}
          onPress={() => {
            // Interactive test / celebrate on tap
            setIsStreakGlowing(true);
            setTimeout(() => setIsStreakGlowing(false), 3500);
          }}
        />

        {/* 3-Digit Slot Reel Result Box [ ? | ? | ? ] */}
        <DiceReels
          status={roundStatus}
          dice={dice}
          targetSum={winningNumber}
        />

        {/* Chronological Last 10 Rounds Outcomes List with Win, Lose & No Play Icons */}
        <DiceGameHistory
          history={history}
          onOpenFullHistory={() => setShowHistory(true)}
        />

        {/* Status Bar (Trophy, 108 Players, 403,029 Balance, 16s Timer, Help ?) */}
        <DiceStatusBar
          balance={balance}
          countdownSeconds={countdownSeconds}
          roundStatus={roundStatus}
          activePlayers={historyQuery.data?.[0]?.players}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenHelp={() => setShowHelp(true)}
        />

        {/* Trend Bar (2S/1E, Quick Category Buttons S, B, E, O, History Button) */}
        <DiceTrendRow
          trendLabel={trendLabel}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          onOpenHistory={() => setShowHistory(true)}
          disabled={roundStatus !== 'OPEN' || hasPlacedBet}
        />

        {/* 28-Number Betting Grid (4 rows x 7 cols) */}
        <DiceBoard
          bets={bets}
          winningNumber={winningNumber}
          isSettled={roundStatus === 'SETTLED'}
          onToggleNumberBet={handleToggleNumberBet}
          disabled={roundStatus !== 'OPEN' || hasPlacedBet}
        />

        {/* Bottom Betting Bar (9,336 🪙 >, Stepper -, Coral Bet Button, Stepper +) */}
        <DiceBettingBar
          currentChip={currentChip}
          totalBet={totalBet}
          balance={balance}
          roundStatus={roundStatus}
          hasPlacedBet={hasPlacedBet}
          onSelectChip={setCurrentChip}
          onIncreaseBet={handleIncreaseBet}
          onDecreaseBet={handleDecreaseBet}
          onConfirmBet={handleConfirmBet}
          onClearBets={handleClearBets}
          onDoubleBets={handleDoubleBets}
        />
      </ScrollView>

      {/* History Modal */}
      <DiceHistoryModal
        visible={showHistory}
        history={history}
        onClose={() => setShowHistory(false)}
      />

      {/* Rules & Odds Modal */}
      <DiceHelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Leaderboard Modal */}
      <DiceLeaderboardModal
        visible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Round Result Board (Win, Lose, or Not Played) */}
      <DiceResultBoard
        visible={showResultBoard}
        result={lastRoundResult}
        countdownSeconds={settledCountdown}
        onClose={() => {
          setShowResultBoard(false);
          onClearPreviewOutcome();
        }}
        onPlayAgain={() => {
          setShowResultBoard(false);
          onClearPreviewOutcome();
        }}
      />

      {/* Global Sound Settings Modal */}
      <DiceSoundSettingsModal
        visible={showSoundSettings}
        settings={soundSettings}
        onUpdateSettings={handleUpdateSoundSettings}
        onClose={() => setShowSoundSettings(false)}
      />

      {/* Tactile Lose Vignette Pulse on Screen Shake */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.loseVignette,
          {
            opacity: loseFlashAnim,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1440',
    position: 'relative',
  },
  loseVignette: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.65)',
    zIndex: 99,
  },
  vortexBackground: {
    ...(StyleSheet.absoluteFill as any),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vortexRing1: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    borderWidth: 60,
    borderColor: 'rgba(30, 58, 138, 0.25)',
  },
  vortexRing2: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 40,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  vortexRing3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 30,
    borderColor: 'rgba(96, 165, 250, 0.12)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
