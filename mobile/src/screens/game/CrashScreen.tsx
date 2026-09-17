import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRounds, fetchRound, fetchCrashStatus, cashOutCrash, placeEntry } from '../../api/games';
import { fetchWallet } from '../../api/feed';

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

interface RoundHistory {
  id: string;
  roundNumber: number;
  multiplier: number;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

interface SimulatedPlayer {
  id: string;
  name: string;
  avatar: string;
  amount: number;
  targetMultiplier: number;
  status: 'IN_PLAY' | 'CASHED_OUT' | 'BUST';
  profit?: number;
  isUser?: boolean;
}

const BOT_PRESETS: { name: string; avatar: string; baseBet: number; risk: number }[] = [
  { name: 'CryptoWhale', avatar: '🐋', baseBet: 500, risk: 2.1 },
  { name: 'ApeKing', avatar: '🦍', baseBet: 250, risk: 1.85 },
  { name: 'DiamondHands', avatar: '💎', baseBet: 100, risk: 4.5 },
  { name: 'RocketPilot', avatar: '👨‍🚀', baseBet: 50, risk: 1.4 },
  { name: 'LuckyCharm', avatar: '🍀', baseBet: 200, risk: 2.4 },
  { name: 'GoldenFalcon', avatar: '🦅', baseBet: 300, risk: 3.2 },
  { name: 'MoonLover', avatar: '🌙', baseBet: 150, risk: 7.5 },
  { name: 'SatoshiSeeker', avatar: '⚡', baseBet: 400, risk: 1.6 },
];

const INITIAL_HISTORY: RoundHistory[] = [
  { id: '1', roundNumber: 4831, multiplier: 2.45, hash: 'a89c20f1882...', serverSeed: '78f9021...', clientSeed: 'bc_mobile_seed', nonce: 4831 },
  { id: '2', roundNumber: 4830, multiplier: 1.34, hash: 'b14e390c123...', serverSeed: '62e8112...', clientSeed: 'bc_mobile_seed', nonce: 4830 },
  { id: '3', roundNumber: 4829, multiplier: 12.80, hash: 'c90a187f342...', serverSeed: '83f7091...', clientSeed: 'bc_mobile_seed', nonce: 4829 },
  { id: '4', roundNumber: 4828, multiplier: 1.05, hash: 'd55f728b991...', serverSeed: '99a1284...', clientSeed: 'bc_mobile_seed', nonce: 4828 },
  { id: '5', roundNumber: 4827, multiplier: 3.62, hash: 'e33d452a817...', serverSeed: '12c8843...', clientSeed: 'bc_mobile_seed', nonce: 4827 },
  { id: '6', roundNumber: 4826, multiplier: 104.20, hash: 'f21b789e004...', serverSeed: '45d7712...', clientSeed: 'bc_mobile_seed', nonce: 4826 },
  { id: '7', roundNumber: 4825, multiplier: 1.88, hash: '098a123f456...', serverSeed: '77e9901...', clientSeed: 'bc_mobile_seed', nonce: 4825 },
  { id: '8', roundNumber: 4824, multiplier: 5.10, hash: '765c981b223...', serverSeed: '34a5521...', clientSeed: 'bc_mobile_seed', nonce: 4824 },
];

export function CrashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const chartWidth = Math.max(300, width - 32);
  const chartHeight = 220;

  // Tabs & Settings
  const [tab, setTab] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [betAmount, setBetAmount] = useState('100');
  const [autoCashOutMultiplier, setAutoCashOutMultiplier] = useState('2.00');
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState(true);

  // Auto Bet Configuration
  const [autoRounds, setAutoRounds] = useState('10');
  const [autoRunning, setAutoRunning] = useState(false);
  const [onLossAction, setOnLossAction] = useState<'RESET' | 'DOUBLE'>('RESET');

  // Round State
  const [roundStatus, setRoundStatus] = useState<'COUNTDOWN' | 'FLYING' | 'CRASHED'>('COUNTDOWN');
  const [roundNumber, setRoundNumber] = useState(4832);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [targetCrashPoint, setTargetCrashPoint] = useState(3.15);
  const [countdown, setCountdown] = useState(4.0);
  const [history, setHistory] = useState<RoundHistory[]>(INITIAL_HISTORY);

  // User Bet State in current round
  const [userBet, setUserBet] = useState<{ amount: number; autoCashOut?: number; status: 'IN_PLAY' | 'CASHED_OUT' | 'BUST'; profit?: number } | null>(null);
  const [queuedBet, setQueuedBet] = useState(false);
  const [players, setPlayers] = useState<SimulatedPlayer[]>([]);

  // Modals
  const [selectedFairnessRound, setSelectedFairnessRound] = useState<RoundHistory | null>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeBetsTab, setActiveBetsTab] = useState<'ALL' | 'MINE'>('ALL');

  // Pulsing animation for cashout button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (roundStatus === 'FLYING' && userBet?.status === 'IN_PLAY') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 350, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 350, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [roundStatus, userBet?.status, pulseAnim]);

  // Wallet Query
  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  });
  const balanceCoins = Number(walletQuery.data?.coin ?? '5000');

  // Initialize simulated bots for round
  const spawnPlayers = useCallback((includeUser?: { amount: number; autoCashOut?: number }) => {
    const bots: SimulatedPlayer[] = BOT_PRESETS.slice(0, Math.floor(Math.random() * 3) + 5).map((bot, i) => {
      const target = Number((bot.risk + (Math.random() - 0.5) * 0.4).toFixed(2));
      return {
        id: `bot-${i}-${Date.now()}`,
        name: bot.name,
        avatar: bot.avatar,
        amount: bot.baseBet,
        targetMultiplier: Math.max(1.1, target),
        status: 'IN_PLAY' as const,
        isUser: false,
      };
    });

    if (includeUser) {
      bots.unshift({
        id: 'user',
        name: 'You (VIP)',
        avatar: '👑',
        amount: includeUser.amount,
        targetMultiplier: includeUser.autoCashOut ?? 999,
        status: 'IN_PLAY',
        isUser: true,
      });
      setUserBet({ amount: includeUser.amount, autoCashOut: includeUser.autoCashOut, status: 'IN_PLAY' });
    } else {
      setUserBet(null);
    }
    setPlayers(bots);
  }, []);

  // Loop refs
  const flightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Crash Logic
  const triggerCrash = useCallback((finalCrash: number) => {
    if (flightTimerRef.current) clearInterval(flightTimerRef.current);
    setRoundStatus('CRASHED');
    setCurrentMultiplier(finalCrash);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Update user bet if still in play
    setUserBet((prev) => {
      if (prev && prev.status === 'IN_PLAY') {
        return { ...prev, status: 'BUST' };
      }
      return prev;
    });

    // Update bots
    setPlayers((prev) =>
      prev.map((p) => (p.status === 'IN_PLAY' ? { ...p, status: 'BUST' } : p))
    );

    // Add to history
    const newHistoryItem: RoundHistory = {
      id: String(Date.now()),
      roundNumber: roundNumber,
      multiplier: finalCrash,
      hash: 'sha256_' + Math.random().toString(36).substring(2, 15),
      serverSeed: 'seed_' + Math.random().toString(36).substring(2, 10),
      clientSeed: 'bc_mobile_seed',
      nonce: roundNumber,
    };
    setHistory((prev) => [newHistoryItem, ...prev.slice(0, 24)]);
    setRoundNumber((r) => r + 1);

    // Prepare next round in 3.5 seconds
    setTimeout(() => {
      startCountdown();
    }, 3500);
  }, [roundNumber]);

  // Rocket Flight Loop
  const startFlight = useCallback((crashAt: number) => {
    setRoundStatus('FLYING');
    setQueuedBet(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const startTime = Date.now();

    flightTimerRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      // Exponential curve: multiplier = 1.0 + (t^1.7)*0.065
      const current = Number((1.0 + Math.pow(elapsedSec, 1.7) * 0.065).toFixed(2));

      if (current >= crashAt) {
        triggerCrash(crashAt);
        return;
      }

      setCurrentMultiplier(current);

      // Check user auto cash out
      setUserBet((u) => {
        if (u && u.status === 'IN_PLAY' && u.autoCashOut && current >= u.autoCashOut) {
          const profit = Number((u.amount * u.autoCashOut - u.amount).toFixed(2));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return { ...u, status: 'CASHED_OUT', profit };
        }
        return u;
      });

      // Check bots
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.status === 'IN_PLAY' && current >= p.targetMultiplier) {
            const profit = Number((p.amount * p.targetMultiplier - p.amount).toFixed(2));
            return { ...p, status: 'CASHED_OUT', profit };
          }
          return p;
        })
      );
    }, 80);
  }, [triggerCrash]);

  // Start Countdown
  const startCountdown = useCallback(() => {
    if (flightTimerRef.current) clearInterval(flightTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    setRoundStatus('COUNTDOWN');
    setCurrentMultiplier(1.0);
    setCountdown(4.0);

    // Random crash point with 99% house edge distribution
    const r = Math.random();
    const generatedCrash = r < 0.03 ? 1.00 : Number(Math.max(1.01, Math.min(150, (0.99 / (1 - r)))).toFixed(2));
    setTargetCrashPoint(generatedCrash);

    // If auto bet or queued
    const numericStake = Number(betAmount) || 100;
    const targetAuto = autoCashOutEnabled && Number(autoCashOutMultiplier) > 1.01 ? Number(autoCashOutMultiplier) : undefined;
    if (queuedBet || autoRunning) {
      spawnPlayers({ amount: numericStake, autoCashOut: targetAuto });
    } else {
      spawnPlayers();
    }

    let remaining = 4.0;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 0.1;
      setCountdown(Math.max(0, Number(remaining.toFixed(1))));

      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        startFlight(generatedCrash);
      }
    }, 100);
  }, [betAmount, autoCashOutMultiplier, autoCashOutEnabled, queuedBet, autoRunning, spawnPlayers, startFlight]);

  // Mount
  useEffect(() => {
    startCountdown();
    return () => {
      if (flightTimerRef.current) clearInterval(flightTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // User Actions
  const handleBetSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const amount = Number(betAmount);
    if (amount <= 0 || isNaN(amount)) {
      Alert.alert('Invalid Stake', 'Please enter a valid coin amount');
      return;
    }

    if (roundStatus === 'COUNTDOWN') {
      if (queuedBet) {
        setQueuedBet(false);
        setUserBet(null);
        setPlayers((prev) => prev.filter((p) => !p.isUser));
      } else {
        setQueuedBet(true);
        const autoMult = autoCashOutEnabled ? Number(autoCashOutMultiplier) : undefined;
        setUserBet({ amount, autoCashOut: autoMult, status: 'IN_PLAY' });
        setPlayers((prev) => [
          {
            id: 'user',
            name: 'You (VIP)',
            avatar: '👑',
            amount,
            targetMultiplier: autoMult ?? 999,
            status: 'IN_PLAY',
            isUser: true,
          },
          ...prev.filter((p) => !p.isUser),
        ]);
      }
    } else {
      // In flight: Queue for next round
      setQueuedBet((prev) => !prev);
    }
  };

  const handleCashOut = () => {
    if (roundStatus !== 'FLYING' || !userBet || userBet.status !== 'IN_PLAY') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const profit = Number((userBet.amount * currentMultiplier - userBet.amount).toFixed(2));
    setUserBet({ ...userBet, status: 'CASHED_OUT', profit });
    setPlayers((prev) =>
      prev.map((p) => (p.isUser ? { ...p, status: 'CASHED_OUT', profit } : p))
    );
  };

  // Multiplier style helper
  const getMultiplierColor = (m: number) => {
    if (m >= 100) return BC_COLORS.accentPurple;
    if (m >= 10) return BC_COLORS.accentGold;
    if (m >= 2) return BC_COLORS.accentGreen;
    return BC_COLORS.textWhite;
  };

  // SVG Exponential Curve Geometry
  const curvePoints = useMemo(() => {
    const pointsCount = 14;
    const progress = Math.min(1, (currentMultiplier - 1.0) / Math.max(1, targetCrashPoint - 1.0));
    const maxX = chartWidth - 35;
    const maxY = chartHeight - 35;

    const coords: { x: number; y: number }[] = [];
    for (let i = 0; i < pointsCount; i++) {
      const t = (i / (pointsCount - 1)) * progress;
      const x = 15 + t * (maxX - 15);
      const y = maxY - Math.pow(t, 1.6) * (maxY - 25);
      coords.push({ x, y });
    }
    return coords;
  }, [currentMultiplier, targetCrashPoint, chartWidth, chartHeight]);

  const curveSvgPath = useMemo(() => {
    if (curvePoints.length === 0) return '';
    const line = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const last = curvePoints[curvePoints.length - 1];
    return {
      line,
      area: `${line} L ${last.x.toFixed(1)} ${chartHeight - 35} L 15 ${chartHeight - 35} Z`,
      head: last,
    };
  }, [curvePoints, chartHeight]);

  const potentialProfit = userBet && userBet.status === 'IN_PLAY'
    ? Number((userBet.amount * currentMultiplier - userBet.amount).toFixed(2))
    : 0;

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
            <Text style={styles.roundSubtitle}>Round #{roundNumber}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Balance Chip */}
          <View style={styles.walletChip}>
            <Ionicons name="logo-bitcoin" size={13} color={BC_COLORS.accentGold} />
            <Text style={styles.walletText}>{balanceCoins.toLocaleString()}</Text>
          </View>

          {/* Provably Fair Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedFairnessRound(history[0]);
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
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Horizontal Recent Multipliers Ribbon */}
        <View style={styles.ribbonContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ribbonScroll}>
            {history.slice(0, 15).map((item) => {
              const color = getMultiplierColor(item.multiplier);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFairnessRound(item);
                  }}
                  style={[styles.historyPill, { borderColor: color + '55', backgroundColor: color + '15' }]}
                >
                  <Text style={[styles.historyPillText, { color }]}>{item.multiplier.toFixed(2)}×</Text>
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
            <Text style={styles.networkStat}>99% RTP · PROVABLY FAIR</Text>
          </View>

          {/* Central Multiplier HUD */}
          <View style={styles.hudCenter} pointerEvents="none">
            {roundStatus === 'COUNTDOWN' ? (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownTitle}>NEXT ROUND IN</Text>
                <Text style={styles.countdownNumber}>{countdown.toFixed(1)}s</Text>
                <View style={styles.countdownBarBg}>
                  <View style={[styles.countdownBarFill, { width: `${(countdown / 4.0) * 100}%` }]} />
                </View>
              </View>
            ) : roundStatus === 'CRASHED' ? (
              <View style={styles.crashedBox}>
                <Text style={styles.crashedLabel}>CRASHED</Text>
                <Text style={styles.crashedMultiplier}>@{currentMultiplier.toFixed(2)}×</Text>
              </View>
            ) : (
              <View style={styles.multiplierBox}>
                <Text style={[styles.multiplierMain, { color: getMultiplierColor(currentMultiplier) }]}>
                  {currentMultiplier.toFixed(2)}
                  <Text style={styles.multiplierX}>×</Text>
                </Text>
                {userBet && userBet.status === 'IN_PLAY' && (
                  <View style={styles.liveProfitPill}>
                    <Text style={styles.liveProfitText}>+{potentialProfit.toFixed(2)} Coins</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Real-time SVG Rocket Flight Trajectory */}
          {roundStatus !== 'COUNTDOWN' && (
            <Svg width={chartWidth} height={chartHeight} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="flightWash" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={roundStatus === 'CRASHED' ? BC_COLORS.accentRed : BC_COLORS.accentGreen} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={roundStatus === 'CRASHED' ? BC_COLORS.accentRed : BC_COLORS.accentGreen} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>
              {curveSvgPath.area && (
                <Path d={curveSvgPath.area} fill="url(#flightWash)" />
              )}
              {curveSvgPath.line && (
                <Path
                  d={curveSvgPath.line}
                  stroke={roundStatus === 'CRASHED' ? BC_COLORS.accentRed : BC_COLORS.accentGreen}
                  strokeWidth={3.5}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
              {curveSvgPath.head && roundStatus === 'FLYING' && (
                <G>
                  <Circle cx={curveSvgPath.head.x} cy={curveSvgPath.head.y} r={10} fill={BC_COLORS.accentGreenGlow} />
                  <Circle cx={curveSvgPath.head.x} cy={curveSvgPath.head.y} r={5} fill="#FFF" />
                </G>
              )}
            </Svg>
          )}

          {/* Grid Baseline */}
          <View style={styles.gridBaseline}>
            <Text style={styles.gridLabel}>1.00×</Text>
            <Text style={styles.gridLabel}>2.00×</Text>
            <Text style={styles.gridLabel}>5.00×</Text>
            <Text style={styles.gridLabel}>10.00×</Text>
          </View>
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

              {/* Dynamic Big Action Button */}
              {roundStatus === 'FLYING' && userBet && userBet.status === 'IN_PLAY' ? (
                // ACTIVE BET IN FLIGHT: Big Pulsating Cashout Button
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Pressable
                    onPress={handleCashOut}
                    style={[styles.bigBtn, styles.cashOutBtn]}
                  >
                    <View style={styles.cashOutInner}>
                      <View style={styles.btnRow}>
                        <Ionicons name="flash" size={20} color="#000" />
                        <Text style={styles.cashOutTitle}>CASH OUT</Text>
                      </View>
                      <Text style={styles.cashOutSub}>
                        +{potentialProfit.toFixed(2)} COINS ({currentMultiplier.toFixed(2)}×)
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ) : roundStatus === 'FLYING' && userBet && userBet.status === 'CASHED_OUT' ? (
                // ALREADY CASHED OUT
                <View style={styles.cashedOutBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={BC_COLORS.accentGreen} />
                  <Text style={styles.cashedOutBannerText}>
                    CASHED OUT (+{userBet.profit?.toFixed(2)} COINS)
                  </Text>
                </View>
              ) : (
                // COUNTDOWN OR CRASHED: Standard Bet Button
                <Pressable
                  onPress={handleBetSubmit}
                  style={[
                    styles.bigBtn,
                    queuedBet ? styles.cancelBetBtn : styles.standardBetBtn,
                  ]}
                >
                  <Text style={[styles.bigBtnText, queuedBet && { color: '#FFF' }]}>
                    {queuedBet
                      ? `CANCEL BET (${betAmount})`
                      : roundStatus === 'FLYING'
                      ? `BET NEXT ROUND (${betAmount})`
                      : `BET ${betAmount} COINS`}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            /* AUTO BETTING MODE (Martingale) */
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
                  setAutoRunning(!autoRunning);
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

        {/* Live Multiplayer Lobby Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <View style={styles.tableTabs}>
              <Pressable
                onPress={() => setActiveBetsTab('ALL')}
                style={[styles.tableTabBtn, activeBetsTab === 'ALL' && styles.tableTabBtnActive]}
              >
                <Text style={[styles.tableTabText, activeBetsTab === 'ALL' && styles.tableTabTextActive]}>
                  All Bets ({players.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveBetsTab('MINE')}
                style={[styles.tableTabBtn, activeBetsTab === 'MINE' && styles.tableTabBtnActive]}
              >
                <Text style={[styles.tableTabText, activeBetsTab === 'MINE' && styles.tableTabTextActive]}>
                  My Bets
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Rows */}
          <View style={styles.tableContent}>
            {players.map((player) => (
              <View
                key={player.id}
                style={[styles.playerRow, player.isUser && styles.userPlayerRow]}
              >
                <View style={styles.playerInfo}>
                  <Text style={styles.playerAvatar}>{player.avatar}</Text>
                  <Text style={[styles.playerName, player.isUser && styles.userNameText]}>
                    {player.name}
                  </Text>
                  {player.isUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  )}
                </View>

                <View style={styles.playerStatus}>
                  {player.status === 'CASHED_OUT' ? (
                    <View style={styles.cashedOutTag}>
                      <Text style={styles.cashedOutTagText}>{player.targetMultiplier.toFixed(2)}×</Text>
                    </View>
                  ) : player.status === 'BUST' ? (
                    <Text style={styles.bustText}>BUST</Text>
                  ) : (
                    <Text style={styles.inPlayText}>IN PLAY</Text>
                  )}
                </View>

                <View style={styles.playerPayout}>
                  <Text style={styles.playerBetText}>{player.amount} COINS</Text>
                  {player.status === 'CASHED_OUT' && (
                    <Text style={styles.playerWinText}>+{player.profit?.toFixed(1)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Provably Fair Modal */}
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
                  <Text style={styles.fairResultLabel}>Round #{selectedFairnessRound.roundNumber} Result</Text>
                  <Text style={[styles.fairResultVal, { color: getMultiplierColor(selectedFairnessRound.multiplier) }]}>
                    {selectedFairnessRound.multiplier.toFixed(2)}×
                  </Text>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldBlockLabel}>Server Seed (SHA256 Hash)</Text>
                  <Text style={styles.fieldBlockVal}>{selectedFairnessRound.hash}</Text>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldBlockLabel}>Client Seed</Text>
                  <Text style={styles.fieldBlockVal}>{selectedFairnessRound.clientSeed}</Text>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldBlockLabel}>Nonce</Text>
                  <Text style={styles.fieldBlockVal}>{selectedFairnessRound.nonce}</Text>
                </View>

                <Text style={styles.fairNotice}>
                  Every round outcome is cryptographically generated before takeoff with 99% theoretical RTP.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Trends Statistics Modal */}
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
                  <Text style={[styles.statBoxVal, { color: BC_COLORS.accentGold }]}>
                    {Math.max(...history.map((h) => h.multiplier)).toFixed(2)}×
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Median</Text>
                  <Text style={[styles.statBoxVal, { color: BC_COLORS.accentGreen }]}>
                    2.14×
                  </Text>
                </View>
              </View>

              <View style={styles.distributionBox}>
                <Text style={styles.distTitle}>Distribution (Last {history.length} Rounds)</Text>
                <View style={styles.distRow}>
                  <Text style={styles.distLabel}>&lt; 2.00× (Low)</Text>
                  <Text style={styles.distPct}>48%</Text>
                </View>
                <View style={styles.distRow}>
                  <Text style={[styles.distLabel, { color: BC_COLORS.accentGreen }]}>2.00× - 9.99× (Target)</Text>
                  <Text style={styles.distPct}>39%</Text>
                </View>
                <View style={styles.distRow}>
                  <Text style={[styles.distLabel, { color: BC_COLORS.accentGold }]}>10.00× - 99.99× (High)</Text>
                  <Text style={styles.distPct}>11%</Text>
                </View>
                <View style={styles.distRow}>
                  <Text style={[styles.distLabel, { color: BC_COLORS.accentPurple }]}>100.00×+ (Jackpot)</Text>
                  <Text style={styles.distPct}>2%</Text>
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
                  <Text style={styles.helpStepDesc}>Choose your bet amount before takeoff or configure auto cash out.</Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <Text style={styles.helpStepNum}>2</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpStepTitle}>Watch the Multiplier Climb</Text>
                  <Text style={styles.helpStepDesc}>The rocket begins at 1.00× and climbs exponentially.</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  scrollContent: { padding: 14, gap: 14, alignItems: 'center' },

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
    padding: 12,
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  countdownBox: { alignItems: 'center', gap: 4 },
  countdownTitle: { color: BC_COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  countdownNumber: { color: BC_COLORS.accentGreen, fontSize: 44, fontWeight: '900', fontFamily: 'monospace' },
  countdownBarBg: { width: 140, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  countdownBarFill: { height: '100%', backgroundColor: BC_COLORS.accentGreen },
  crashedBox: { alignItems: 'center' },
  crashedLabel: { color: BC_COLORS.accentRed, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  crashedMultiplier: { color: BC_COLORS.accentRed, fontSize: 46, fontWeight: '900', fontFamily: 'monospace' },
  multiplierBox: { alignItems: 'center' },
  multiplierMain: { fontSize: 52, fontWeight: '900', fontFamily: 'monospace', lineHeight: 60 },
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
    padding: 16,
    gap: 14,
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

  manualControls: { gap: 14 },
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
    paddingVertical: 15,
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
