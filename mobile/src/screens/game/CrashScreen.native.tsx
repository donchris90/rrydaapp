import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Line, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRounds,
  fetchCrashStatus,
  cashOutCrash,
  placeEntry,
  fetchMyEntries,
  fetchBigWins,
  type GameRound,
} from '../../api/games';
import { fetchWallet } from '../../api/feed';
import { playSound, setEngineMultiplier, startEngine, stopEngine, useSoundsEnabled } from '../../utils/gameAudio';
import { derivePhase, flightElapsedMs, flightMultiplier, flightWindow, multiplierAtMs, pathOf, rocketRotationDeg, syncClock, trajectory, type FlightClock, type Phase } from './crashFlight';

// BC.Game Visual Palette
const BC_COLORS = {
  bg: '#0F1115',
  card: '#1E2024',
  cardDark: '#14161A',
  cardHover: '#282B31',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  accentGreen: '#00E701',
  accentGreenGlow: 'rgba(0, 231, 1, 0.25)',
  accentGold: '#FFB800',
  accentPurple: '#A855F7',
  accentRed: '#FF4757',
  textWhite: '#FFFFFF',
  textMuted: '#8E9297',
  textDim: '#5B6068',
};

// GameDefinition.code in the seed data is uppercase ('CRASH'), not 'crash'
// — this must match exactly or fetchRounds('crash') would silently return
// no rounds at all against a real backend (confirmed against prisma/seed.ts).
const GAME_CODE = 'CRASH';

// The moving part of the stage: the multiplier, the curve and the rocket. It redraws
// about 30 times a second while a round is in flight, working the multiplier out from
// the flight clock — so it glides — and the rest of the screen is left alone.
function FlightLayer({
  phase,
  width,
  height,
  growthRate,
  getElapsedMs,
  crashedElapsedMs,
  entryCoins,
  colorFor,
}: {
  phase: Phase;
  width: number;
  height: number;
  growthRate: number | null;
  getElapsedMs: () => number;
  crashedElapsedMs: number;
  entryCoins: number | null;
  colorFor: (m: number) => string;
}) {
  const [, setFrame] = useState(0);
  useEffect(() => {
    if (phase !== 'FLYING') return;
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last >= 33) {
        last = ts;
        setFrame((f) => (f + 1) % 1_000_000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const g = growthRate ?? Math.log(2) / 5;
  const crashed = phase === 'CRASHED';
  const elapsed = crashed ? crashedElapsedMs : phase === 'FLYING' ? getElapsedMs() : 0;
  const multiplier = multiplierAtMs(g, elapsed);
  const pad = { l: 12, r: 24, t: 40, b: 22 };
  const { points, head, angleDeg } = trajectory(g, elapsed, width, height, pad);
  const { maxM } = flightWindow(elapsed, g);
  const tone = crashed ? BC_COLORS.accentRed : BC_COLORS.accentGreen;
  const line = pathOf(points);
  const area = `${line} L ${head.x.toFixed(1)} ${height - pad.b} L ${points[0].x.toFixed(1)} ${height - pad.b} Z`;
  const spanY = height - pad.t - pad.b;

  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="flightWash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tone} stopOpacity="0.25" />
            <Stop offset="1" stopColor={tone} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        {[0, 1 / 3, 2 / 3, 1].map((f) => {
          const y = height - pad.b - f * spanY;
          const m = 1 + f * (maxM - 1);
          return (
            <G key={f}>
              <Line x1={pad.l} x2={width - pad.r + 8} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <SvgText x={pad.l + 2} y={y - 3} fill={BC_COLORS.textDim} fontSize={9}>
                {`${m.toFixed(m < 10 ? 1 : 0)}×`}
              </SvgText>
            </G>
          );
        })}
        <Path d={area} fill="url(#flightWash)" />
        <Path d={line} stroke={tone} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        {phase === 'FLYING' && <Circle cx={head.x} cy={head.y} r={11} fill={BC_COLORS.accentGreenGlow} />}
      </Svg>

      {/* The rocket, turned to follow the curve; a burst where it crashed */}
      <Text
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: head.x - 15,
          top: head.y - 15,
          fontSize: 26,
          transform: crashed ? [] : [{ rotate: `${rocketRotationDeg(angleDeg)}deg` }],
        }}
      >
        {crashed ? '💥' : '🚀'}
      </Text>

      {!crashed && (
        <View style={styles.hudCenter} pointerEvents="none">
          <View style={styles.multiplierBox}>
            <Text style={[styles.multiplierMain, { color: colorFor(multiplier) }]}>
              {multiplier.toFixed(2)}
              <Text style={styles.multiplierX}>×</Text>
            </Text>
            {entryCoins != null && phase === 'FLYING' && (
              <View style={styles.liveProfitPill}>
                <Text style={styles.liveProfitText}>+{(entryCoins * multiplier - entryCoins).toFixed(2)} Coins</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
}

// ---------------------------------------------------------------------
// This screen previously ran an entirely local simulation: the crash
// point was generated with Math.random() on-device (reproducing the
// same house-edge formula that already existed correctly, server-side,
// in games/crash-rules.ts), the flight multiplier was a local
// setInterval loop, and cash-out profit was computed locally with no
// wallet interaction at all. fetchRounds/placeEntry/cashOutCrash/
// fetchCrashStatus were imported and never called.
//
// Every piece of game state below now comes from the real, transactional,
// provably-fair backend (EntryService, CrashService, RngService) — this
// screen only reads round/entry state and reacts to it; it never decides
// a crash point, a multiplier, or a payout itself.
// ---------------------------------------------------------------------

export function CrashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const chartWidth = Math.max(280, width - 48);
  const chartHeight = 190;

  // Tabs & Settings
  const [tab, setTab] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [betAmount, setBetAmount] = useState('100');
  const [autoCashOutMultiplier, setAutoCashOutMultiplier] = useState('2.00');
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState(true);

  // Auto Bet Configuration — UI only; see handleToggleAutoRun below for
  // why this doesn't actually place repeated real bets yet.
  const [autoRunning, setAutoRunning] = useState(false);
  const [onLossAction, setOnLossAction] = useState<'RESET' | 'DOUBLE'>('RESET');

  // Modals / view state
  const [selectedFairnessRound, setSelectedFairnessRound] = useState<GameRound | null>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeBetsTab, setActiveBetsTab] = useState<'ALL' | 'MINE'>('ALL');

  // Ticks purely to re-render the countdown against the round's real,
  // server-set `lockAt` timestamp — this doesn't invent any game data,
  // it just redraws a diff against a timestamp the server already gave us.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Real wallet — unchanged, this was already correctly wired; it just
  // wasn't being read from anywhere on this screen before.
  const walletQuery = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  // Normal + bonus coins: the server stakes bonus coins first, and anything a
  // bonus-funded stake wins stays bonus coins (they can be played, never withdrawn).
  const bonusCoins = Number(walletQuery.data?.bonus ?? '0');
  const balanceCoins = Number(walletQuery.data?.coin ?? '0') + bonusCoins;

  // The round lifecycle itself. Rounds are created/opened/locked/settled
  // by the server's own scheduler — nothing here is simulated. The list is
  // checked often around the moments that matter (a round about to lock, a flight
  // in progress) so the screen never sits on stale news, and gently otherwise.
  const roundsQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'rounds'],
    queryFn: () => fetchRounds(GAME_CODE),
    refetchInterval: (query) => {
      const list = (query.state.data ?? []) as GameRound[];
      if (list.some((r) => r.status === 'LOCKED')) return 1500;
      const open = list.find((r) => r.status === 'OPEN');
      if (open && Date.now() >= new Date(open.lockAt).getTime() - 300) return 500;
      return 2500;
    },
  });
  const rounds = roundsQuery.data ?? [];
  const liveRound = rounds.find((r) => r.status === 'OPEN' || r.status === 'LOCKED') ?? null;
  const settledRounds = rounds.filter((r) => r.status === 'SETTLED');

  // When a flight ends the round leaves the open/in-flight list. Keep showing its
  // result for a few seconds (the crash, and whether you cashed out) before the next
  // countdown takes over — before, it vanished the instant it settled.
  const [held, setHeld] = useState<{ round: GameRound; until: number } | null>(null);
  const lastLiveRef = useRef<GameRound | null>(null);
  useEffect(() => {
    if (liveRound) {
      lastLiveRef.current = liveRound;
      return;
    }
    const last = lastLiveRef.current;
    // A round that ended normally keeps its result up for a moment; one the server
    // cancelled (say, after a restart) has no result to show.
    const cancelled = last ? rounds.find((r) => r.id === last.id)?.status === 'CANCELLED' : false;
    if (last && last.status === 'LOCKED' && !cancelled) setHeld({ round: last, until: Date.now() + 5000 });
    lastLiveRef.current = null;
  }, [liveRound?.id, liveRound?.status]);
  const holdActive = !!held && now < held.until;
  const heldRound = holdActive ? rounds.find((r) => r.id === held!.round.id) ?? held!.round : null;
  // The round the screen is about: the live one, or the one that just ended.
  const currentRound: GameRound | null = liveRound ?? heldRound;

  // The server's answer about the flight, checked about three times a second while a
  // round is in flight. It is used to keep a local clock right, and to hear about the crash.
  const crashStatusQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'status', liveRound?.id],
    queryFn: async () => {
      const sentAt = Date.now();
      const data = await fetchCrashStatus(liveRound!.id);
      return { data, sentAt, receivedAt: Date.now() };
    },
    enabled: !!liveRound && liveRound.status === 'LOCKED',
    refetchInterval: 350,
    retry: 1,
  });

  // The flight clock: between answers the phone works the multiplier out itself, many
  // times a second, so the rocket glides instead of jumping each time an answer arrives.
  const clockRef = useRef<FlightClock | null>(null);
  const frozenRef = useRef<{ elapsedMs: number; multiplier: number } | null>(null);
  const growthRef = useRef<number | null>(null);
  useEffect(() => {
    clockRef.current = null;
    frozenRef.current = null;
  }, [liveRound?.id]);
  useEffect(() => {
    const sample = crashStatusQuery.data;
    if (!sample) return;
    const d = sample.data;
    if (d.status === 'LIVE' && d.growthRate != null && d.elapsedMs != null) {
      growthRef.current = d.growthRate;
      clockRef.current = syncClock(clockRef.current, { growthRate: d.growthRate, elapsedMs: d.elapsedMs, sentAt: sample.sentAt, receivedAt: sample.receivedAt });
    }
  }, [crashStatusQuery.dataUpdatedAt]);

  // My own entry in the current round (0 or 1).
  const myEntriesQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'myEntries', currentRound?.id],
    queryFn: () => fetchMyEntries(currentRound!.id),
    enabled: !!currentRound,
    refetchInterval: currentRound?.status === 'LOCKED' ? 1000 : false,
  });
  const myEntry = myEntriesQuery.data?.[0] ?? null;

  // Real recent big wins (no invented players).
  const bigWinsQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'bigWins'],
    queryFn: () => fetchBigWins(GAME_CODE),
    refetchInterval: 8000,
  });

  const crashedByServer = crashStatusQuery.data?.data.status === 'CRASHED' || (liveRound == null && holdActive);
  const flyingByServer = crashStatusQuery.data?.data.status === 'LIVE' && !!clockRef.current;
  const roundStatus: Phase = derivePhase({ round: liveRound, live: flyingByServer, crashed: crashedByServer, now, holdUntil: held?.until ?? 0 });

  // The moment the crash is first seen, remember exactly where the rocket was, so the
  // picture holds still there until the official crash point arrives.
  if (roundStatus === 'CRASHED' && !frozenRef.current && clockRef.current) {
    const el = flightElapsedMs(clockRef.current, now);
    frozenRef.current = { elapsedMs: el, multiplier: multiplierAtMs(clockRef.current.growthRate, el) };
  }

  const settledCrashPoint =
    (currentRound?.result as { crashPoint?: number } | null)?.crashPoint ??
    (crashStatusQuery.data?.data.status === 'CRASHED' ? crashStatusQuery.data.data.multiplier : null) ??
    null;
  const liveMultiplier = roundStatus === 'FLYING' && clockRef.current ? flightMultiplier(clockRef.current, now) : 1.0;
  const currentMultiplier = roundStatus === 'CRASHED' ? settledCrashPoint ?? frozenRef.current?.multiplier ?? 1.0 : liveMultiplier;
  // How far along the picture should be drawn once it has crashed.
  const crashedElapsedMs =
    growthRef.current && settledCrashPoint && settledCrashPoint > 1 ? (Math.log(settledCrashPoint) / growthRef.current) * 1000 : frozenRef.current?.elapsedMs ?? 0;

  const countdownWindowSec = currentRound
    ? Math.max(1, (new Date(currentRound.lockAt).getTime() - new Date(currentRound.openAt).getTime()) / 1000)
    : 4;
  const countdown = currentRound && currentRound.status === 'OPEN' ? Math.max(0, (new Date(currentRound.lockAt).getTime() - now) / 1000) : 0;

  useEffect(() => {
    if (roundStatus === 'FLYING' && myEntry?.status === 'PLACED') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 350, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 350, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [roundStatus, myEntry?.status, pulseAnim]);

  // Fires haptic feedback off the real status transition instead of a
  // local loop calling triggerCrash() directly.
  const prevStatusRef = useRef(roundStatus);
  useEffect(() => {
    if (prevStatusRef.current !== 'CRASHED' && roundStatus === 'CRASHED') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playSound('crash');
      // Settlement lands about a second after the crash: refresh what you won or lost.
      const id = currentRound?.id;
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['games', GAME_CODE, 'myEntries', id] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      };
      const t1 = setTimeout(refresh, 1200);
      const t2 = setTimeout(refresh, 3200);
      prevStatusRef.current = roundStatus;
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    prevStatusRef.current = roundStatus;
  }, [roundStatus]);

  // ── sound ──
  const [soundsOn, toggleSounds] = useSoundsEnabled();
  useEffect(() => {
    if (roundStatus === 'FLYING') startEngine();
    else stopEngine();
  }, [roundStatus, soundsOn]);
  useEffect(() => {
    if (roundStatus === 'FLYING') setEngineMultiplier(liveMultiplier);
  }, [liveMultiplier, roundStatus]);
  useEffect(() => () => stopEngine(), []);
  // the last three seconds of the countdown tick
  const tickSec = roundStatus === 'COUNTDOWN' && currentRound?.status === 'OPEN' ? Math.ceil(countdown) : 0;
  useEffect(() => {
    if (tickSec >= 1 && tickSec <= 3) playSound('tick', 0.7);
  }, [tickSec]);

  const canBet = currentRound?.status === 'OPEN' && !myEntry;

  const placeMutation = useMutation({
    mutationFn: () => {
      if (!currentRound) throw new Error('No round is open for entries right now');
      const amount = Math.floor(Number(betAmount));
      return placeEntry(currentRound.id, {
        selection: [],
        stakeAmount: amount,
        idempotencyKey: Crypto.randomUUID(),
        autoCashoutMultiplier: autoCashOutEnabled ? Number(autoCashOutMultiplier) : undefined,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      playSound('bet');
      queryClient.invalidateQueries({ queryKey: ['games', GAME_CODE, 'myEntries', currentRound?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      Alert.alert('Could not place bet', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const cashOutMutation = useMutation({
    mutationFn: () => cashOutCrash(currentRound!.id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('cashout');
      queryClient.invalidateQueries({ queryKey: ['games', GAME_CODE, 'myEntries', currentRound?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      Alert.alert('Too late', error?.response?.data?.message ?? 'The round has already crashed.');
    },
  });

  const handleBetSubmit = () => {
    const amount = Number(betAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      Alert.alert('Invalid Stake', 'Please enter a valid coin amount');
      return;
    }
    if (!currentRound || currentRound.status !== 'OPEN') {
      Alert.alert('Round not open', 'Wait for the next round to start accepting bets.');
      return;
    }
    placeMutation.mutate();
  };

  const handleCashOut = () => {
    if (!currentRound || roundStatus !== 'FLYING' || !myEntry || myEntry.status !== 'PLACED') return;
    cashOutMutation.mutate();
  };

  // Automatic repeated real-money betting across rounds isn't built —
  // the old "auto bet" toggle here never actually re-placed a bet
  // either, it just spawned one extra cosmetic bot row once per
  // simulated round. Being honest about that gap rather than quietly
  // wiring it to fire repeated real placeEntry() calls unattended (which
  // needs its own loss-limit/stop-condition design, not just an API call).
  const handleToggleAutoRun = () => {
    Alert.alert(
      'Not available yet',
      "Automatic multi-round betting isn't implemented against the real game engine yet — place bets manually for now.",
    );
  };

  const getMultiplierColor = (m: number) => {
    if (m >= 100) return BC_COLORS.accentPurple;
    if (m >= 10) return BC_COLORS.accentGold;
    if (m >= 2) return BC_COLORS.accentGreen;
    return BC_COLORS.textWhite;
  };

  const potentialProfit =
    myEntry && myEntry.status === 'PLACED'
      ? Number((myEntry.coinAmount * currentMultiplier - myEntry.coinAmount).toFixed(2))
      : 0;

  // Real distribution stats derived from actually-settled rounds (up to
  // the last 20 the backend returns) — replaces the four hardcoded
  // percentages and hardcoded "2.14×" median that used to sit here.
  const trendStats = useMemo(() => {
    const multipliers = settledRounds
      .map((r) => (r.result as { crashPoint?: number } | null)?.crashPoint ?? 0)
      .filter((m) => m > 0);
    if (multipliers.length === 0) return { max: 0, median: 0, low: 0, mid: 0, high: 0, jackpot: 0 };
    const sorted = [...multipliers].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const pct = (pred: (m: number) => boolean) =>
      Math.round((multipliers.filter(pred).length / multipliers.length) * 100);
    return {
      max: Math.max(...multipliers),
      median,
      low: pct((m) => m < 2),
      mid: pct((m) => m >= 2 && m < 10),
      high: pct((m) => m >= 10 && m < 100),
      jackpot: pct((m) => m >= 100),
    };
  }, [settledRounds]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* BC.Game Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={22} color={BC_COLORS.textWhite} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.rocketEmoji}>🚀</Text>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>CRASH</Text>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>ORIGINAL</Text>
              </View>
            </View>
            <Text style={styles.roundSubtitle}>
              {currentRound ? `Round #${currentRound.id.slice(0, 6).toUpperCase()}` : 'Waiting for next round…'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Balance Chip */}
          <View style={styles.walletChip}>
            <Ionicons name="logo-bitcoin" size={13} color={BC_COLORS.accentGold} />
            <Text style={styles.walletText}>
              {balanceCoins.toLocaleString()}
              {bonusCoins > 0 ? ` (${bonusCoins.toLocaleString()} bonus)` : ''}
            </Text>
          </View>

          {/* Provably Fair Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedFairnessRound(settledRounds[0] ?? null);
            }}
            style={styles.iconBtnRound}
          >
            <Ionicons name="shield-checkmark-outline" size={17} color={BC_COLORS.accentGreen} />
          </Pressable>

          {/* Help Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowHelp(true);
            }}
            style={styles.iconBtnRound}
          >
            <Ionicons name="help-circle-outline" size={18} color={BC_COLORS.textMuted} />
          </Pressable>

          {/* Sound on / off (remembered) */}
          <Pressable onPress={toggleSounds} style={styles.iconBtnRound} accessibilityLabel={soundsOn ? 'Turn sound off' : 'Turn sound on'}>
            <Ionicons name={soundsOn ? 'volume-high' : 'volume-mute'} size={17} color={soundsOn ? BC_COLORS.accentGreen : BC_COLORS.textMuted} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        {/* Horizontal Recent Multipliers Ribbon — real settled rounds only */}
        <View style={styles.ribbonContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ribbonScroll}>
            {settledRounds.length === 0 && (
              <Text style={{ color: BC_COLORS.textDim, fontSize: 11, paddingVertical: 4 }}>No rounds settled yet</Text>
            )}
            {settledRounds.slice(0, 15).map((round) => {
              const multiplier = (round.result as { crashPoint?: number } | null)?.crashPoint ?? 0;
              const color = getMultiplierColor(multiplier);
              return (
                <Pressable
                  key={round.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFairnessRound(round);
                  }}
                  style={[styles.historyPill, { borderColor: color + '55', backgroundColor: color + '15' }]}
                >
                  <Text style={[styles.historyPillText, { color }]}>{multiplier.toFixed(2)}×</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTrends(true);
            }}
            style={styles.trendsBtn}
          >
            <Ionicons name="bar-chart-outline" size={15} color={BC_COLORS.accentGreen} />
            <Text style={styles.trendsBtnText}>Trends</Text>
          </Pressable>
        </View>

        {/* 60FPS Flight Stage Card */}
        <View style={[styles.stageCard, { width: chartWidth, height: chartHeight }]}>
          {/* Top Stage Bar */}
          <View style={styles.stageTopBar}>
            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: roundStatus === 'FLYING' ? BC_COLORS.accentGreen : roundStatus === 'CRASHED' ? BC_COLORS.accentRed : BC_COLORS.accentGold }]} />
              <Text style={styles.statusText}>
                {roundStatus === 'FLYING' ? 'IN FLIGHT' : roundStatus === 'CRASHED' ? 'CRASHED' : 'STARTING'}
              </Text>
            </View>
            <Text style={styles.networkStat}>PROVABLY FAIR</Text>
          </View>

          {/* Central Multiplier HUD */}
          <View style={styles.hudCenter} pointerEvents="none">
            {roundStatus === 'COUNTDOWN' ? (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownTitle}>{currentRound ? 'NEXT ROUND IN' : 'WAITING FOR NEXT ROUND'}</Text>
                <Text style={styles.countdownNumber}>{currentRound ? `${countdown.toFixed(1)}s` : '—'}</Text>
                <View style={styles.countdownBarBg}>
                  <View style={[styles.countdownBarFill, { width: `${Math.min(100, (countdown / countdownWindowSec) * 100)}%` }]} />
                </View>
              </View>
            ) : roundStatus === 'CRASHED' ? (
              <View style={styles.crashedBox}>
                <Text style={styles.crashedLabel}>CRASHED</Text>
                <Text style={styles.crashedMultiplier}>
                  {settledCrashPoint != null ? `@${settledCrashPoint.toFixed(2)}×` : 'Settling…'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Real-time SVG Rocket Flight Trajectory */}
          {roundStatus !== 'COUNTDOWN' && (
            <FlightLayer
              phase={roundStatus}
              width={chartWidth}
              height={chartHeight}
              growthRate={growthRef.current}
              getElapsedMs={() => (clockRef.current ? flightElapsedMs(clockRef.current, Date.now()) : 0)}
              crashedElapsedMs={crashedElapsedMs}
              entryCoins={myEntry && myEntry.status === 'PLACED' ? myEntry.coinAmount : null}
              colorFor={getMultiplierColor}
            />
          )}
        </View>

        {/* Wagering Console (Manual vs Auto) */}
        <View style={styles.consoleCard}>
          {/* Mode Switch Tabs */}
          <View style={styles.modeTabBar}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab('MANUAL');
              }}
              style={[styles.modeTabBtn, tab === 'MANUAL' && styles.modeTabBtnActive]}
            >
              <Text style={[styles.modeTabText, tab === 'MANUAL' && styles.modeTabTextActive]}>Manual</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab('AUTO');
              }}
              style={[styles.modeTabBtn, tab === 'AUTO' && styles.modeTabBtnActive]}
            >
              <Ionicons
                name="flash-outline"
                size={13}
                color={tab === 'AUTO' ? BC_COLORS.accentGreen : BC_COLORS.textMuted}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.modeTabText, tab === 'AUTO' && styles.modeTabTextActive]}>Auto</Text>
            </Pressable>
          </View>

          {tab === 'MANUAL' ? (
            <View style={styles.manualControls}>
              {/* Stake Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Bet Amount</Text>
                  <Text style={styles.inputHint}>Min: 10</Text>
                </View>
                <View style={styles.inputBox}>
                  <Ionicons name="logo-bitcoin" size={17} color={BC_COLORS.accentGold} style={{ marginRight: 6 }} />
                  <TextInput
                    keyboardType="numeric"
                    value={betAmount}
                    onChangeText={setBetAmount}
                    style={styles.textInput}
                    placeholder="100"
                    placeholderTextColor={BC_COLORS.textDim}
                  />
                  <View style={styles.quickModifiers}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBetAmount((b) => String(Math.max(10, Math.floor(Number(b) / 2))));
                      }}
                      style={styles.modBtn}
                    >
                      <Text style={styles.modBtnText}>½</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBetAmount((b) => String(Math.min(balanceCoins, Math.floor(Number(b) * 2))));
                      }}
                      style={styles.modBtn}
                    >
                      <Text style={styles.modBtnText}>2×</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBetAmount(String(Math.floor(balanceCoins)));
                      }}
                      style={styles.modBtn}
                    >
                      <Text style={styles.modBtnText}>Max</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Auto Cashout Multiplier */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Pressable
                    onPress={() => setAutoCashOutEnabled(!autoCashOutEnabled)}
                    style={styles.checkboxLabel}
                  >
                    <Ionicons
                      name={autoCashOutEnabled ? 'checkbox' : 'square-outline'}
                      size={16}
                      color={autoCashOutEnabled ? BC_COLORS.accentGreen : BC_COLORS.textDim}
                    />
                    <Text style={styles.inputLabel}>Auto Cash Out</Text>
                  </Pressable>
                  <Text style={styles.inputHint}>Multiplier</Text>
                </View>
                <View style={[styles.inputBox, !autoCashOutEnabled && { opacity: 0.5 }]}>
                  <TextInput
                    keyboardType="numeric"
                    editable={autoCashOutEnabled}
                    value={autoCashOutMultiplier}
                    onChangeText={setAutoCashOutMultiplier}
                    style={styles.textInput}
                    placeholder="2.00"
                    placeholderTextColor={BC_COLORS.textDim}
                  />
                  <View style={styles.quickChips}>
                    {['1.5', '2.0', '5.0', '10.0'].map((m) => (
                      <Pressable
                        key={m}
                        disabled={!autoCashOutEnabled}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setAutoCashOutMultiplier(m);
                          setAutoCashOutEnabled(true);
                        }}
                        style={[
                          styles.chipBtn,
                          autoCashOutMultiplier === m && autoCashOutEnabled && styles.chipBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipBtnText,
                            autoCashOutMultiplier === m && autoCashOutEnabled && styles.chipBtnTextActive,
                          ]}
                        >
                          {m}×
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Dynamic Big Action Button — driven entirely by the real
                  GameEntry status (PLACED/WON/LOST), not local state. */}
              {roundStatus === 'FLYING' && myEntry?.status === 'PLACED' ? (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Pressable
                    onPress={handleCashOut}
                    disabled={cashOutMutation.isPending}
                    style={[styles.bigBtn, styles.cashOutBtn, cashOutMutation.isPending && { opacity: 0.7 }]}
                  >
                    <View style={styles.cashOutInner}>
                      <View style={styles.btnRow}>
                        <Ionicons name="flash" size={20} color="#000" />
                        <Text style={styles.cashOutTitle}>{cashOutMutation.isPending ? 'CASHING OUT…' : 'CASH OUT'}</Text>
                      </View>
                      <Text style={styles.cashOutSub}>
                        +{potentialProfit.toFixed(2)} COINS ({currentMultiplier.toFixed(2)}×)
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ) : myEntry && myEntry.status === 'WON' ? (
                <View style={styles.cashedOutBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={BC_COLORS.accentGreen} />
                  <Text style={styles.cashedOutBannerText}>
                    CASHED OUT (+{(myEntry.rewardAmount - myEntry.coinAmount).toFixed(2)} COINS)
                  </Text>
                </View>
              ) : myEntry && myEntry.status === 'LOST' ? (
                <View style={[styles.cashedOutBanner, { backgroundColor: 'rgba(255,71,87,0.12)', borderColor: 'rgba(255,71,87,0.3)' }]}>
                  <Ionicons name="close-circle" size={20} color={BC_COLORS.accentRed} />
                  <Text style={[styles.cashedOutBannerText, { color: BC_COLORS.accentRed }]}>
                    BUSTED — LOST {myEntry.coinAmount} COINS
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleBetSubmit}
                  disabled={!canBet || placeMutation.isPending}
                  style={[styles.bigBtn, styles.standardBetBtn, (!canBet || placeMutation.isPending) && { opacity: 0.5 }]}
                >
                  <Text style={styles.bigBtnText}>
                    {placeMutation.isPending
                      ? 'PLACING BET…'
                      : !currentRound || currentRound.status !== 'OPEN'
                      ? 'WAITING FOR NEXT ROUND…'
                      : `BET ${betAmount} COINS`}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            /* AUTO BETTING MODE — UI preserved, but see handleToggleAutoRun:
               this doesn't place real repeated bets yet. */
            <View style={styles.autoControls}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Base Bet</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    keyboardType="numeric"
                    value={betAmount}
                    onChangeText={setBetAmount}
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cash Out At (Multiplier)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    keyboardType="numeric"
                    value={autoCashOutMultiplier}
                    onChangeText={setAutoCashOutMultiplier}
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>On Loss Strategy</Text>
                <View style={styles.strategyRow}>
                  <Pressable
                    onPress={() => setOnLossAction('RESET')}
                    style={[styles.strategyBtn, onLossAction === 'RESET' && styles.strategyBtnActive]}
                  >
                    <Text style={[styles.strategyBtnText, onLossAction === 'RESET' && styles.strategyBtnTextActive]}>
                      Reset
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setOnLossAction('DOUBLE')}
                    style={[styles.strategyBtn, onLossAction === 'DOUBLE' && styles.strategyBtnActive]}
                  >
                    <Text style={[styles.strategyBtnText, onLossAction === 'DOUBLE' && styles.strategyBtnTextActive]}>
                      Double (Martingale)
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  handleToggleAutoRun();
                }}
                style={[styles.bigBtn, autoRunning ? styles.cancelBetBtn : styles.standardBetBtn]}
              >
                <Text style={[styles.bigBtnText, autoRunning && { color: '#FFF' }]}>
                  {autoRunning ? 'STOP AUTO BET' : 'START AUTO BET'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Recent Big Wins / My Bet — real data, replacing the fake bot roster */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <View style={styles.tableTabs}>
              <Pressable
                onPress={() => setActiveBetsTab('ALL')}
                style={[styles.tableTabBtn, activeBetsTab === 'ALL' && styles.tableTabBtnActive]}
              >
                <Text style={[styles.tableTabText, activeBetsTab === 'ALL' && styles.tableTabTextActive]}>
                  Recent Big Wins
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveBetsTab('MINE')}
                style={[styles.tableTabBtn, activeBetsTab === 'MINE' && styles.tableTabBtnActive]}
              >
                <Text style={[styles.tableTabText, activeBetsTab === 'MINE' && styles.tableTabTextActive]}>
                  My Bet
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.tableContent}>
            {activeBetsTab === 'ALL' ? (
              (bigWinsQuery.data ?? []).length === 0 ? (
                <Text style={styles.emptyTableText}>No big wins yet — be the first.</Text>
              ) : (
                (bigWinsQuery.data ?? []).map((win) => (
                  <View key={win.id} style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                      <Ionicons name="person-circle-outline" size={16} color={BC_COLORS.textMuted} />
                      {/* No username lookup exists for GameEntry.userId — see
                          api/games.ts's fetchBigWins comment. Not inventing one. */}
                      <Text style={styles.playerName}>Player {win.userId.slice(0, 6)}</Text>
                    </View>
                    <View style={styles.playerPayout}>
                      <Text style={styles.playerBetText}>{win.coinAmount} COINS</Text>
                      <Text style={styles.playerWinText}>+{win.rewardAmount - win.coinAmount}</Text>
                    </View>
                  </View>
                ))
              )
            ) : myEntry ? (
              <View style={[styles.playerRow, styles.userPlayerRow]}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerAvatar}>👑</Text>
                  <Text style={[styles.playerName, styles.userNameText]}>You</Text>
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                </View>
                <View style={styles.playerStatus}>
                  {myEntry.status === 'WON' ? (
                    <View style={styles.cashedOutTag}>
                      <Text style={styles.cashedOutTagText}>{(myEntry.cashedOutMultiplier ?? 1).toFixed(2)}×</Text>
                    </View>
                  ) : myEntry.status === 'LOST' ? (
                    <Text style={styles.bustText}>BUST</Text>
                  ) : (
                    <Text style={styles.inPlayText}>IN PLAY</Text>
                  )}
                </View>
                <View style={styles.playerPayout}>
                  <Text style={styles.playerBetText}>{myEntry.coinAmount} COINS</Text>
                  {myEntry.status === 'WON' && (
                    <Text style={styles.playerWinText}>+{myEntry.rewardAmount - myEntry.coinAmount}</Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.emptyTableText}>You haven't placed a bet this round.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Provably Fair Modal — real commitment hash / revealed secret from
          GameRound, not a fabricated hash string. */}
      <Modal
        visible={!!selectedFairnessRound}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFairnessRound(null)}
      >
        <Pressable
          onPress={() => setSelectedFairnessRound(null)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalDialog} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTop}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color={BC_COLORS.accentGreen} />
                <Text style={styles.modalTitle}>Provably Fair Verification</Text>
              </View>
              <Pressable onPress={() => setSelectedFairnessRound(null)}>
                <Ionicons name="close" size={22} color={BC_COLORS.textMuted} />
              </Pressable>
            </View>

            {selectedFairnessRound && (
              <View style={styles.modalBody}>
                <View style={styles.fairResultBox}>
                  <Text style={styles.fairResultLabel}>Round #{selectedFairnessRound.id.slice(0, 6).toUpperCase()} Result</Text>
                  <Text
                    style={[
                      styles.fairResultVal,
                      { color: getMultiplierColor((selectedFairnessRound.result as { crashPoint?: number } | null)?.crashPoint ?? 0) },
                    ]}
                  >
                    {((selectedFairnessRound.result as { crashPoint?: number } | null)?.crashPoint ?? 0).toFixed(2)}×
                  </Text>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldBlockLabel}>Commitment Hash (published before this round opened)</Text>
                  <Text style={styles.fieldBlockVal}>{selectedFairnessRound.commitmentHash ?? '—'}</Text>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldBlockLabel}>Revealed Secret (published after settlement)</Text>
                  <Text style={styles.fieldBlockVal}>{selectedFairnessRound.revealData ?? '—'}</Text>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldBlockLabel}>Settled At</Text>
                  <Text style={styles.fieldBlockVal}>
                    {selectedFairnessRound.settledAt ? new Date(selectedFairnessRound.settledAt).toLocaleString() : '—'}
                  </Text>
                </View>

                <Text style={styles.fairNotice}>
                  The crash point is generated server-side with a cryptographically secure RNG before the round opens,
                  and is never sent to any client until after it has crashed.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Trends Statistics Modal — real stats from settled rounds */}
      <Modal
        visible={showTrends}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrends(false)}
      >
        <Pressable
          onPress={() => setShowTrends(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalDialog} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTop}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="bar-chart" size={20} color={BC_COLORS.accentGreen} />
                <Text style={styles.modalTitle}>Game Multiplier Trends</Text>
              </View>
              <Pressable onPress={() => setShowTrends(false)}>
                <Ionicons name="close" size={22} color={BC_COLORS.textMuted} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.trendsStatsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Max Multiplier</Text>
                  <Text style={[styles.statBoxVal, { color: BC_COLORS.accentGold }]}>{trendStats.max.toFixed(2)}×</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Median</Text>
                  <Text style={[styles.statBoxVal, { color: BC_COLORS.accentGreen }]}>{trendStats.median.toFixed(2)}×</Text>
                </View>
              </View>

              <View style={styles.distributionBox}>
                <Text style={styles.distTitle}>Distribution (Last {settledRounds.length} Rounds)</Text>
                <View style={styles.distRow}>
                  <Text style={styles.distLabel}>&lt; 2.00× (Low)</Text>
                  <Text style={styles.distPct}>{trendStats.low}%</Text>
                </View>
                <View style={styles.distRow}>
                  <Text style={[styles.distLabel, { color: BC_COLORS.accentGreen }]}>2.00× - 9.99× (Target)</Text>
                  <Text style={styles.distPct}>{trendStats.mid}%</Text>
                </View>
                <View style={styles.distRow}>
                  <Text style={[styles.distLabel, { color: BC_COLORS.accentGold }]}>10.00× - 99.99× (High)</Text>
                  <Text style={styles.distPct}>{trendStats.high}%</Text>
                </View>
                <View style={styles.distRow}>
                  <Text style={[styles.distLabel, { color: BC_COLORS.accentPurple }]}>100.00×+ (Jackpot)</Text>
                  <Text style={styles.distPct}>{trendStats.jackpot}%</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowTrends(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* How to Play Help Modal */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <Pressable
          onPress={() => setShowHelp(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalDialog} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTop}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="help-circle" size={20} color={BC_COLORS.accentGreen} />
                <Text style={styles.modalTitle}>How to Play Crash</Text>
              </View>
              <Pressable onPress={() => setShowHelp(false)}>
                <Ionicons name="close" size={22} color={BC_COLORS.textMuted} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.helpStep}>
                <Text style={styles.helpStepNum}>1</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpStepTitle}>Place Your Wager</Text>
                  <Text style={styles.helpStepDesc}>Choose your bet amount while the round is open, or configure auto cash out.</Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <Text style={styles.helpStepNum}>2</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpStepTitle}>Watch the Multiplier Climb</Text>
                  <Text style={styles.helpStepDesc}>The rocket begins at 1.00× and climbs exponentially, computed live on the server.</Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <Text style={styles.helpStepNum}>3</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpStepTitle}>Cash Out Before the Crash</Text>
                  <Text style={styles.helpStepDesc}>Hit Cash Out to pocket your winnings. If it crashes first, your wager is lost!</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowHelp(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>Got it!</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BC_COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: BC_COLORS.border,
  },
  iconBtn: { padding: 6 },
  iconBtnRound: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: BC_COLORS.card,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rocketEmoji: { fontSize: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: BC_COLORS.textWhite, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  brandBadge: {
    backgroundColor: 'rgba(0, 231, 1, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 231, 1, 0.35)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandBadgeText: { color: BC_COLORS.accentGreen, fontSize: 8, fontWeight: '800' },
  roundSubtitle: { color: BC_COLORS.textDim, fontSize: 10, fontFamily: 'monospace' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BC_COLORS.cardDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
  },
  walletText: { color: BC_COLORS.textWhite, fontWeight: '800', fontSize: 11, fontFamily: 'monospace' },
  scrollContent: { padding: 10, gap: 10, alignItems: 'center' },

  // Ribbon
  ribbonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: BC_COLORS.card,
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
  },
  ribbonScroll: { gap: 6, paddingRight: 8 },
  historyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyPillText: { fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  trendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: BC_COLORS.cardDark,
    borderRadius: 8,
    borderLeftWidth: 1,
    borderColor: BC_COLORS.border,
  },
  trendsBtnText: { color: BC_COLORS.textWhite, fontSize: 11, fontWeight: '700' },

  // Flight Stage Card
  stageCard: {
    backgroundColor: BC_COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
    padding: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  stageTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: BC_COLORS.textWhite, fontSize: 9, fontWeight: '800' },
  networkStat: { color: BC_COLORS.textDim, fontSize: 9, fontWeight: '700' },
  hudCenter: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  countdownBox: { alignItems: 'center', gap: 4 },
  countdownTitle: { color: BC_COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  countdownNumber: { color: BC_COLORS.accentGreen, fontSize: 38, fontWeight: '900', fontFamily: 'monospace' },
  countdownBarBg: { width: 140, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  countdownBarFill: { height: '100%', backgroundColor: BC_COLORS.accentGreen },
  crashedBox: { alignItems: 'center' },
  crashedLabel: { color: BC_COLORS.accentRed, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  crashedMultiplier: { color: BC_COLORS.accentRed, fontSize: 40, fontWeight: '900', fontFamily: 'monospace' },
  multiplierBox: { alignItems: 'center' },
  multiplierMain: { fontSize: 44, fontWeight: '900', fontFamily: 'monospace', lineHeight: 52 },
  multiplierX: { fontSize: 32 },
  liveProfitPill: {
    backgroundColor: 'rgba(0,231,1,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BC_COLORS.accentGreen,
    marginTop: 4,
  },
  liveProfitText: { color: BC_COLORS.accentGreen, fontSize: 11, fontWeight: '800' },
  gridBaseline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingTop: 4,
  },
  gridLabel: { color: BC_COLORS.textDim, fontSize: 9, fontFamily: 'monospace' },

  // Wagering Console
  consoleCard: {
    width: '100%',
    backgroundColor: BC_COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
    padding: 12,
    gap: 10,
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: BC_COLORS.cardDark,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  modeTabBtnActive: { backgroundColor: BC_COLORS.cardHover },
  modeTabText: { color: BC_COLORS.textDim, fontSize: 12, fontWeight: '700' },
  modeTabTextActive: { color: BC_COLORS.accentGreen },

  manualControls: { gap: 10 },
  inputGroup: { gap: 6 },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputLabel: { color: BC_COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  inputHint: { color: BC_COLORS.textDim, fontSize: 10 },
  checkboxLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BC_COLORS.cardDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  textInput: {
    flex: 1,
    color: BC_COLORS.textWhite,
    fontSize: 15,
    fontWeight: '800',
    paddingVertical: 8,
    fontFamily: 'monospace',
  },
  quickModifiers: { flexDirection: 'row', gap: 4 },
  modBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: BC_COLORS.cardHover,
    borderRadius: 7,
  },
  modBtnText: { color: BC_COLORS.textWhite, fontSize: 11, fontWeight: '800' },
  quickChips: { flexDirection: 'row', gap: 4 },
  chipBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: BC_COLORS.cardHover,
    borderRadius: 6,
  },
  chipBtnActive: {
    backgroundColor: 'rgba(0,231,1,0.2)',
    borderWidth: 1,
    borderColor: BC_COLORS.accentGreen,
  },
  chipBtnText: { color: BC_COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  chipBtnTextActive: { color: BC_COLORS.accentGreen },

  bigBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardBetBtn: {
    backgroundColor: BC_COLORS.accentGreen,
    shadowColor: BC_COLORS.accentGreen,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  cancelBetBtn: {
    backgroundColor: BC_COLORS.accentRed,
  },
  cashOutBtn: {
    backgroundColor: BC_COLORS.accentGreen,
    shadowColor: BC_COLORS.accentGreen,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 6,
  },
  cashOutInner: { alignItems: 'center', gap: 2 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cashOutTitle: { color: '#000', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  cashOutSub: { color: '#000', fontSize: 12, fontWeight: '800' },
  bigBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  cashedOutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,231,1,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,231,1,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  cashedOutBannerText: { color: BC_COLORS.accentGreen, fontSize: 13, fontWeight: '800' },

  autoControls: { gap: 12 },
  strategyRow: { flexDirection: 'row', gap: 8 },
  strategyBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: BC_COLORS.cardDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
  },
  strategyBtnActive: { borderColor: BC_COLORS.accentGreen, backgroundColor: 'rgba(0,231,1,0.1)' },
  strategyBtnText: { color: BC_COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  strategyBtnTextActive: { color: BC_COLORS.accentGreen },

  // Multiplayer Table
  tableCard: {
    width: '100%',
    backgroundColor: BC_COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
    padding: 14,
    gap: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: BC_COLORS.border,
    paddingBottom: 8,
  },
  tableTabs: { flexDirection: 'row', gap: 6 },
  tableTabBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tableTabBtnActive: { backgroundColor: BC_COLORS.cardHover },
  tableTabText: { color: BC_COLORS.textDim, fontSize: 11, fontWeight: '700' },
  tableTabTextActive: { color: BC_COLORS.accentGreen },
  tableContent: { gap: 4 },
  emptyTableText: { color: BC_COLORS.textDim, fontSize: 11, textAlign: 'center', paddingVertical: 12 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  userPlayerRow: {
    backgroundColor: 'rgba(0,231,1,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,231,1,0.2)',
  },
  playerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 2 },
  playerAvatar: { fontSize: 15 },
  playerName: { color: BC_COLORS.textWhite, fontSize: 12, fontWeight: '600' },
  userNameText: { color: BC_COLORS.accentGreen, fontWeight: '800' },
  youBadge: { backgroundColor: BC_COLORS.accentGreen, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  youBadgeText: { color: '#000', fontSize: 8, fontWeight: '900' },
  playerStatus: { flex: 1, alignItems: 'center' },
  cashedOutTag: { backgroundColor: 'rgba(0,231,1,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  cashedOutTagText: { color: BC_COLORS.accentGreen, fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  bustText: { color: BC_COLORS.accentRed, fontSize: 10, fontWeight: '700' },
  inPlayText: { color: BC_COLORS.textDim, fontSize: 10, fontWeight: '600' },
  playerPayout: { flex: 2, alignItems: 'flex-end' },
  playerBetText: { color: BC_COLORS.textMuted, fontSize: 11, fontFamily: 'monospace' },
  playerWinText: { color: BC_COLORS.accentGreen, fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: BC_COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BC_COLORS.border,
    padding: 18,
    gap: 14,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: BC_COLORS.border,
    paddingBottom: 10,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { color: BC_COLORS.textWhite, fontSize: 15, fontWeight: '800' },
  modalBody: { gap: 12 },
  fairResultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BC_COLORS.cardDark,
    padding: 12,
    borderRadius: 12,
  },
  fairResultLabel: { color: BC_COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  fairResultVal: { fontSize: 22, fontWeight: '900', fontFamily: 'monospace' },
  fieldBlock: { gap: 4 },
  fieldBlockLabel: { color: BC_COLORS.textDim, fontSize: 10, fontWeight: '700' },
  fieldBlockVal: {
    backgroundColor: BC_COLORS.cardDark,
    padding: 8,
    borderRadius: 8,
    color: BC_COLORS.textWhite,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  fairNotice: { color: BC_COLORS.textDim, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  trendsStatsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: BC_COLORS.cardDark,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statBoxLabel: { color: BC_COLORS.textDim, fontSize: 10, fontWeight: '700' },
  statBoxVal: { fontSize: 18, fontWeight: '900', fontFamily: 'monospace' },
  distributionBox: { backgroundColor: BC_COLORS.cardDark, borderRadius: 12, padding: 12, gap: 8 },
  distTitle: { color: BC_COLORS.textWhite, fontSize: 11, fontWeight: '800' },
  distRow: { flexDirection: 'row', justifyContent: 'space-between' },
  distLabel: { color: BC_COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  distPct: { color: BC_COLORS.textWhite, fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  modalCloseBtn: {
    backgroundColor: BC_COLORS.cardHover,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: { color: BC_COLORS.textWhite, fontSize: 13, fontWeight: '700' },
  helpStep: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  helpStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BC_COLORS.accentGreen,
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '900',
    fontSize: 11,
  },
  helpStepTitle: { color: BC_COLORS.textWhite, fontSize: 12, fontWeight: '800' },
  helpStepDesc: { color: BC_COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
export default CrashScreen;
