import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import {
  fetchRounds,
  fetchMyEntries,
  fetchCrashStatus,
  placeEntry,
  cashOutCrash,
  fetchHistory,
  type GameEntry,
} from '../../api/games';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { colors, radii, spacing, type } from '../../theme';

const GAME_CODE = 'CRASH';

// A point actually received from the server — never a computed/faked
// one. The curve below draws a smooth line through these real polled
// values; it is a rendering of real data at 400ms resolution, not a
// second, independent animation pretending to track the round.
interface MultiplierPoint {
  t: number; // seconds since this round went live, from Date.now() at poll time
  m: number; // the real multiplier value returned by CrashService.getStatus at that instant
}

// Curve, countdown, quick-stake buttons, and live payout preview adapted
// from a web reference the user provided — its visual language, not its
// math. That reference generates crashPoint with Math.random() in the
// browser and fabricates a pool of fake bot players; neither made it
// into this screen. Every number here still comes from the real,
// server-authoritative CrashService this project already had.
function MultiplierCurve({ points, isCrashed, width, height }: { points: MultiplierPoint[]; isCrashed: boolean; width: number; height: number }) {
  if (points.length < 2) return null;

  const maxT = Math.max(points[points.length - 1].t, 1);
  const maxM = Math.max(...points.map((p) => p.m), 2) * 1.15;
  const padding = 8;

  const toX = (t: number) => padding + (t / maxT) * (width - padding * 2);
  const toY = (m: number) => height - padding - ((m - 1) / (maxM - 1)) * (height - padding * 2);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.t).toFixed(1)} ${toY(p.m).toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${toX(points[points.length - 1].t).toFixed(1)} ${height - padding} L ${toX(points[0].t).toFixed(1)} ${height - padding} Z`;
  const tip = points[points.length - 1];
  const lineColor = isCrashed ? colors.danger : '#1FD174';

  return (
    <Svg width={width} height={height}>
      <Path d={fillPath} fill={lineColor} opacity={0.15} />
      <Path d={linePath} stroke={lineColor} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {!isCrashed && <Circle cx={toX(tip.t)} cy={toY(tip.m)} r={6} fill="#FFF" />}
      {!isCrashed && <Circle cx={toX(tip.t)} cy={toY(tip.m)} r={11} stroke={lineColor} strokeWidth={2} fill="none" opacity={0.6} />}
    </Svg>
  );
}

// expo-audio players don't reset their own position after finishing —
// seekTo(0) first is what makes a short effect replayable on every tap
// rather than only ever playing once.
function playSound(player: { seekTo: (s: number) => void; play: () => void }) {
  player.seekTo(0);
  player.play();
}

export function CrashScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  // useAudioPlayer is a hook — called once at the top level per sound.
  const betPlayer = useAudioPlayer(require('../../../assets/bet.wav'));
  const cashoutPlayer = useAudioPlayer(require('../../../assets/cashout.wav'));
  const crashPlayer = useAudioPlayer(require('../../../assets/crash.wav'));
  const [stake, setStake] = useState('100');
  const [autoCashout, setAutoCashout] = useState('');
  const [now, setNow] = useState(Date.now());
  const historyRef = useRef<MultiplierPoint[]>([]);
  const roundStartRef = useRef<string | null>(null);
  const crashHapticFiredRef = useRef<string | null>(null);

  // Purely cosmetic ticker for the countdown text below — recomputed
  // every 250ms from the round's own real lockAt timestamp, never a
  // second timer pretending to know when the round will actually open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const roundsQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'rounds'],
    queryFn: () => fetchRounds(GAME_CODE),
    refetchInterval: 3000,
  });
  const currentRound = roundsQuery.data?.[0];
  const currentRoundId = currentRound?.id;
  const roundStatus = currentRound?.status;

  const crashStatusQuery = useQuery({
    queryKey: ['games', 'crash-status', currentRoundId],
    queryFn: () => fetchCrashStatus(currentRoundId!),
    enabled: !!currentRoundId && roundStatus === 'LOCKED',
    refetchInterval: 400,
  });

  // Reset the recorded curve whenever a new round starts, and append
  // each real polled point as it arrives.
  useEffect(() => {
    if (roundStartRef.current !== currentRoundId) {
      roundStartRef.current = currentRoundId ?? null;
      historyRef.current = [];
    }
    if (crashStatusQuery.data?.status === 'LIVE' && crashStatusQuery.data.multiplier != null) {
      const t = currentRound?.lockAt ? (Date.now() - new Date(currentRound.lockAt).getTime()) / 1000 : historyRef.current.length * 0.4;
      historyRef.current = [...historyRef.current, { t: Math.max(0, t), m: crashStatusQuery.data.multiplier }].slice(-200);
    }
  }, [crashStatusQuery.data, currentRoundId, currentRound?.lockAt]);

  const myEntriesQuery = useQuery({
    queryKey: ['games', 'myEntries', currentRoundId],
    queryFn: () => fetchMyEntries(currentRoundId!),
    enabled: !!currentRoundId,
    refetchInterval: 3000,
  });
  const myEntry: GameEntry | undefined = myEntriesQuery.data?.[0];

  // A real haptic exactly once per crash, not once per poll — the
  // status stays 'CRASHED' across many subsequent 400ms polls while
  // this screen keeps showing it, so this needs its own one-shot guard
  // rather than firing inline in the render.
  useEffect(() => {
    if (crashStatusQuery.data?.status === 'CRASHED' && currentRoundId && crashHapticFiredRef.current !== currentRoundId) {
      crashHapticFiredRef.current = currentRoundId;
      playSound(crashPlayer);
      if (myEntry?.status === 'PLACED') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }
  }, [crashStatusQuery.data?.status, currentRoundId, myEntry?.status]);

  const historyQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'history'],
    queryFn: () => fetchHistory(GAME_CODE),
  });

  const placeMutation = useMutation({
    mutationFn: () => {
      const stakeAmount = parseInt(stake, 10);
      const autoCashoutMultiplier = autoCashout.trim() ? parseFloat(autoCashout) : undefined;
      return placeEntry(currentRoundId!, {
        selection: [],
        stakeAmount,
        idempotencyKey: Crypto.randomUUID(),
        autoCashoutMultiplier,
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound(betPlayer);
      queryClient.invalidateQueries({ queryKey: ['games', 'myEntries', currentRoundId] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Could not place bet', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const cashOutMutation = useMutation({
    mutationFn: () => cashOutCrash(currentRoundId!),
    onSuccess: (entry) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound(cashoutPlayer);
      queryClient.invalidateQueries({ queryKey: ['games', 'myEntries', currentRoundId] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert('Cashed out!', `You won ${entry.rewardAmount.toLocaleString()} coins at ${entry.cashedOutMultiplier}x.`);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Too late', error?.response?.data?.message ?? "The round already crashed before this reached the server.");
    },
  });

  const isLive = roundStatus === 'LOCKED';
  const isOpen = roundStatus === 'OPEN' || roundStatus === 'SCHEDULED';
  const isCrashed = crashStatusQuery.data?.status === 'CRASHED';
  const multiplier = crashStatusQuery.data?.multiplier ?? 1.0;
  const canCashOut = isLive && myEntry?.status === 'PLACED' && !isCrashed;
  const alreadyEnteredThisRound = !!myEntry;
  const stakeNum = parseInt(stake, 10) || 0;
  const livePayout = canCashOut ? Math.floor((myEntry?.coinAmount ?? 0) * multiplier) : 0;

  const secondsToLock = currentRound?.lockAt ? Math.max(0, (new Date(currentRound.lockAt).getTime() - now) / 1000) : null;

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Crash</Text>
      </View>

      <View style={styles.multiplierCard}>
        {!currentRoundId ? (
          <ActivityIndicator color={colors.primary} />
        ) : isCrashed ? (
          <>
            <MultiplierCurve points={historyRef.current} isCrashed width={300} height={120} />
            <Text style={styles.crashedLabel}>CRASHED AT</Text>
            <Text style={styles.crashedMultiplier}>{(crashStatusQuery.data?.multiplier ?? 0).toFixed(2)}x</Text>
          </>
        ) : isLive ? (
          <>
            <MultiplierCurve points={historyRef.current} isCrashed={false} width={300} height={120} />
            <Text style={styles.liveLabel}>LIVE</Text>
            <Text style={styles.multiplierText}>{multiplier.toFixed(2)}x</Text>
            {canCashOut && <Text style={styles.livePayoutText}>Live win: {livePayout.toLocaleString()} coins</Text>}
          </>
        ) : (
          <>
            <Ionicons name="hourglass-outline" size={28} color={colors.textMuted} />
            <Text style={styles.waitingText}>
              {secondsToLock != null ? `Starts in ${secondsToLock.toFixed(1)}s` : 'Waiting for next round...'}
            </Text>
          </>
        )}
      </View>

      {myEntry && (
        <View style={styles.entryStatusCard}>
          <Text style={styles.entryStatusText}>
            {myEntry.status === 'PLACED' && `Bet placed: ${myEntry.coinAmount.toLocaleString()} coins`}
            {myEntry.status === 'WON' && `You won ${myEntry.rewardAmount.toLocaleString()} coins at ${myEntry.cashedOutMultiplier}x`}
            {myEntry.status === 'LOST' && `You lost ${myEntry.coinAmount.toLocaleString()} coins`}
          </Text>
        </View>
      )}

      {canCashOut ? (
        <Pressable
          style={styles.cashOutButton}
          onPress={() => cashOutMutation.mutate()}
          disabled={cashOutMutation.isPending}
        >
          <Text style={styles.cashOutText}>
            {cashOutMutation.isPending ? 'Cashing out...' : `CASH OUT · ${livePayout.toLocaleString()} coins`}
          </Text>
        </Pressable>
      ) : isOpen && !alreadyEnteredThisRound ? (
        <View style={styles.betCard}>
          <Text style={styles.betLabel}>Stake (coins)</Text>
          <View style={styles.stakeRow}>
            <TextInput style={[styles.betInput, { flex: 1 }]} value={stake} onChangeText={setStake} keyboardType="number-pad" />
            <Pressable style={styles.quickButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStake(String(Math.max(1, Math.floor(stakeNum / 2)))); }}>
              <Text style={styles.quickButtonText}>½</Text>
            </Pressable>
            <Pressable style={styles.quickButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStake(String(stakeNum * 2)); }}>
              <Text style={styles.quickButtonText}>2x</Text>
            </Pressable>
          </View>
          <Text style={styles.betLabel}>Auto cash-out at (optional, e.g. 2.5)</Text>
          <TextInput
            style={styles.betInput}
            value={autoCashout}
            onChangeText={setAutoCashout}
            keyboardType="decimal-pad"
            placeholder="Leave blank to cash out manually"
            placeholderTextColor={colors.textMuted}
          />
          <View style={{ marginTop: spacing.sm }}>
            <GradientButton
              label={placeMutation.isPending ? 'Placing...' : 'Place Bet'}
              onPress={() => placeMutation.mutate()}
              loading={placeMutation.isPending}
              disabled={!stakeNum}
            />
          </View>
        </View>
      ) : isOpen && alreadyEnteredThisRound ? (
        <Text style={styles.waitingText}>Bet placed — waiting for the round to start.</Text>
      ) : null}

      <Text style={styles.historyTitle}>Recent crashes</Text>
      <View style={styles.historyRow}>
        {(historyQuery.data ?? []).slice(0, 10).map((row) => {
          const crashPoint = (row.result as any)?.crashPoint;
          if (crashPoint == null) return null;
          return (
            <View key={row.id} style={[styles.historyChip, crashPoint >= 2 ? styles.historyChipGood : styles.historyChipBad]}>
              <Text style={styles.historyChipText}>{crashPoint.toFixed(2)}x</Text>
            </View>
          );
        })}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: { padding: spacing.xs },
  title: { ...type.h2, color: colors.textPrimary },
  multiplierCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    overflow: 'hidden',
  },
  liveLabel: { color: colors.pink, fontWeight: '800', letterSpacing: 2, fontSize: 12, marginTop: spacing.sm },
  multiplierText: { color: colors.gold, fontSize: 44, fontWeight: '900' },
  livePayoutText: { color: '#1FD174', fontSize: 13, fontWeight: '700', marginTop: 4 },
  crashedLabel: { color: colors.danger, fontWeight: '800', letterSpacing: 2, fontSize: 12, marginTop: spacing.sm },
  crashedMultiplier: { color: colors.danger, fontSize: 36, fontWeight: '900' },
  waitingText: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
  entryStatusCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  entryStatusText: { ...type.body, color: colors.textPrimary },
  cashOutButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.danger,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  cashOutText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  betCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  betLabel: { ...type.caption, color: colors.textSecondary, fontWeight: '700', marginTop: spacing.sm },
  stakeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, alignItems: 'center' },
  quickButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickButtonText: { color: colors.textPrimary, fontWeight: '700' },
  betInput: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  historyTitle: { ...type.bodyStrong, color: colors.textPrimary, marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md },
  historyChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.pill },
  historyChipGood: { backgroundColor: 'rgba(76, 217, 100, 0.2)' },
  historyChipBad: { backgroundColor: 'rgba(245, 73, 91, 0.2)' },
  historyChipText: { color: colors.textPrimary, fontWeight: '700', fontSize: 12 },
});
