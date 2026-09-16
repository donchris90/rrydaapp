import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import type { AppStackParamList } from '../../navigation/types';
import { fetchRounds, fetchRound, fetchPool, fetchMyEntries, fetchHistory, fetchStats, placeEntry } from '../../api/games';
import { fetchWallet } from '../../api/feed';
import { PressableScale } from '../../components/PressableScale';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'SumDice'>;

const GAME_CODE = 'SUM_DICE';
const MAX_NUMBER = 27;
const NUMBERS = Array.from({ length: MAX_NUMBER + 1 }, (_, i) => i);
const STAKE_STEP = 50;
const MIN_STAKE = 50;

// Bright, glossy white/sky-blue palette — a full replacement of the
// earlier dark metallic-gold theme, at the user's explicit request
// ("the whole screen") after seeing a reference app with this look:
// white "candy button" tiles with a bottom-edge bevel shadow, a
// white/cyan glossy capsule for the dice reels, sky-blue for selection,
// emerald for the winning number, amber reserved for the one accent
// that carries real meaning (the settled sum, the bet button) rather
// than spread across every element.
const palette = {
  bg: '#EAF2FB',
  bgPanel: '#FFFFFF',
  bgCard: '#F4F8FD',
  border: '#D7E6F7',
  borderStrong: '#A9CFEF',
  cyan: '#38BDF8',
  cyanDeep: '#0EA5E9',
  sky: '#60A5FA',
  skyDeep: '#1D4ED8',
  amber: '#F59E0B',
  amberBright: '#FCD34D',
  amberDeep: '#B45309',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  slateBevel: '#94A3B8',
  emerald: '#10B981',
  emeraldDeep: '#047857',
  danger: '#EF4444',
};

function smallNumbers() { return NUMBERS.filter((n) => n < 14); }
function bigNumbers() { return NUMBERS.filter((n) => n >= 14); }
function evenNumbers() { return NUMBERS.filter((n) => n % 2 === 0); }
function oddNumbers() { return NUMBERS.filter((n) => n % 2 !== 0); }

// expo-audio players don't reset their own position after finishing —
// seekTo(0) first is what makes a short effect replayable on every tap
// rather than only ever playing once.
function playSound(player: { seekTo: (s: number) => void; play: () => void }) {
  player.seekTo(0);
  player.play();
}

function useCountdown(targetIso: string | undefined): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);
  if (!targetIso) return 0;
  return Math.max(0, Math.floor((new Date(targetIso).getTime() - now) / 1000));
}

// One reel — cycles through random digits while `rolling`, then locks to
// the real `value` once rolling stops. The random frames shown mid-spin
// are never presented as real; only the final locked value (always the
// genuine backend result) is the actual outcome. Same honest pattern as
// a physical slot reel or a televised lottery draw — the outcome is
// already determined, the spin is a deliberate reveal delay, not a fake
// live computation.
function DigitReel({ value, rolling }: { value: number | string; rolling: boolean }) {
  const [display, setDisplay] = useState<number | string>(value);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!rolling) {
      setDisplay(value);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.15, friction: 3, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      return;
    }
    const interval = setInterval(() => setDisplay(Math.floor(Math.random() * 10)), 70);
    return () => clearInterval(interval);
  }, [rolling, value]);

  return (
    <Animated.View style={[styles.reelSlot, { transform: [{ scale }] }]}>
      <Text style={styles.reelDigit}>{display}</Text>
    </Animated.View>
  );
}

export function SumDiceScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  // useAudioPlayer is a hook — must be called at the top level, once per
  // sound, not created dynamically. seekTo(0) before every play() because
  // expo-audio (unlike the old expo-av) does not reset playback position
  // on its own once a sound finishes — without it, only the first tap of
  // each sound would ever be heard again.
  const tileClickPlayer = useAudioPlayer(require('../../../assets/tile-click.wav'));
  const reelLockPlayer = useAudioPlayer(require('../../../assets/reel-lock.wav'));
  const winPlayer = useAudioPlayer(require('../../../assets/win.wav'));
  const betPlayer = useAudioPlayer(require('../../../assets/bet.wav'));
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [stakeValue, setStakeValue] = useState(100);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  // Which reels have "locked" onto the real value yet — drives the
  // staggered jackpot-style stop (reel 1, then 2, then 3), rather than
  // all three landing at once.
  const [lockedReels, setLockedReels] = useState<[boolean, boolean, boolean]>([false, false, false]);

  const roundsQuery = useQuery({
    queryKey: ['games', GAME_CODE, 'rounds'],
    queryFn: () => fetchRounds(GAME_CODE),
    refetchInterval: 4000,
  });
  const currentRoundId = roundsQuery.data?.[0]?.id;

  const roundQuery = useQuery({
    queryKey: ['games', 'round', currentRoundId],
    queryFn: () => fetchRound(currentRoundId!),
    enabled: !!currentRoundId,
    refetchInterval: 1500,
  });
  const round = roundQuery.data;

  const poolQuery = useQuery({
    queryKey: ['games', 'pool', currentRoundId],
    queryFn: () => fetchPool(currentRoundId!),
    enabled: !!currentRoundId,
    refetchInterval: 3000,
  });

  const myEntriesQuery = useQuery({
    queryKey: ['games', 'myEntries', currentRoundId],
    queryFn: () => fetchMyEntries(currentRoundId!),
    enabled: !!currentRoundId && round?.status === 'SETTLED',
  });

  const walletQuery = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const statsQuery = useQuery({ queryKey: ['games', GAME_CODE, 'stats'], queryFn: () => fetchStats(GAME_CODE) });
  const historyQuery = useQuery({ queryKey: ['games', GAME_CODE, 'history'], queryFn: () => fetchHistory(GAME_CODE), enabled: isHistoryOpen });

  const secondsToLock = useCountdown(round?.status === 'OPEN' ? round.lockAt : undefined);
  const isOpen = round?.status === 'OPEN';
  const isSettled = round?.status === 'SETTLED';
  const isDrawing = round?.status === 'LOCKED' || round?.status === 'RESOLVING';
  const drawnDice = round?.result?.dice as number[] | undefined;

  // Drives the staggered reel-stop the instant a NEW settled result
  // appears — resets to "all rolling" whenever the round id changes, so
  // a fresh round always gets its own fresh reveal rather than showing
  // stale locked digits from the previous round while waiting.
  const trackedRoundId = useRef<string | null>(null);
  useEffect(() => {
    if (round?.id !== trackedRoundId.current) {
      trackedRoundId.current = round?.id ?? null;
      setLockedReels([false, false, false]);
    }
    if (isSettled && drawnDice) {
      const timers = [
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          playSound(reelLockPlayer);
          setLockedReels((r) => [true, r[1], r[2]]);
        }, 600),
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          playSound(reelLockPlayer);
          setLockedReels((r) => [r[0], true, r[2]]);
        }, 1100),
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          playSound(reelLockPlayer);
          setLockedReels((r) => [r[0], r[1], true]);
        }, 1600),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isSettled, drawnDice, round?.id]);

  const myWinningEntry = myEntriesQuery.data?.find((e) => e.status === 'WON');
  const revealedRoundId = useRef<string | null>(null);
  useEffect(() => {
    if (isSettled && round && myWinningEntry && revealedRoundId.current !== round.id) {
      revealedRoundId.current = round.id;
      const t = setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playSound(winPlayer);
        Alert.alert('You won', `Prize: ${myWinningEntry.rewardAmount} coins`);
      }, 1900);
      return () => clearTimeout(t);
    }
  }, [isSettled, round, myWinningEntry]);

  const totalPool = useMemo(() => {
    if (!poolQuery.data?.applicable) return null;
    return Object.values(poolQuery.data.pool).reduce((sum, v) => sum + v, 0);
  }, [poolQuery.data]);

  const maxPoolValue = useMemo(() => {
    if (!poolQuery.data?.applicable) return 0;
    return Math.max(1, ...Object.values(poolQuery.data.pool));
  }, [poolQuery.data]);

  const streakSummary = useMemo(() => {
    const seq = statsQuery.data?.sequence?.slice(0, 3) ?? [];
    if (seq.length === 0) return null;
    return seq.map((r) => `${r.size}${r.parity}`).join(' / ');
  }, [statsQuery.data]);

  const placeMutation = useMutation({
    mutationFn: async () => {
      if (!currentRoundId) throw new Error('No active round');
      return placeEntry(currentRoundId, {
        selection: Array.from(selected),
        stakeAmount: stakeValue,
        idempotencyKey: Crypto.randomUUID(),
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound(betPlayer);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['games', 'pool', currentRoundId] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Bet failed', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const toggleNumber = (n: number) => {
    if (!isOpen) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound(tileClickPlayer);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const applyShortcut = (numbers: number[]) => {
    if (!isOpen) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound(tileClickPlayer);
    setSelected(new Set(numbers));
  };

  const canBet = isOpen && selected.size > 0 && stakeValue > 0;
  const walletCoins = walletQuery.data?.coin ?? '0';
  const allReelsLocked = lockedReels.every(Boolean);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={palette.skyDeep} />
          </Pressable>
          <View style={styles.wordmarkWrap}>
            <Text style={styles.wordmark}>Lucky Number</Text>
          </View>
          <Pressable
            style={styles.iconButton}
            onPress={() =>
              Alert.alert(
                'How to play',
                'Pick any numbers from 0–27, or use S/B/E/O to select a whole category. Your stake splits evenly across everything you pick. If the dice total lands on one of your numbers, you win.',
              )
            }
          >
            <Ionicons name="help-outline" size={20} color={palette.skyDeep} />
          </Pressable>
        </View>

        <View style={styles.reelCapsule}>
          <View style={styles.reelCapsuleShine} />
          <View style={styles.reelRow}>
            {[0, 1, 2].map((i) => {
              const rolling = isDrawing || (isSettled && !lockedReels[i]);
              const value = isSettled && drawnDice ? drawnDice[i] : '?';
              return (
                <React.Fragment key={i}>
                  {i > 0 && <View style={styles.reelDivider} />}
                  <DigitReel value={value} rolling={rolling} />
                </React.Fragment>
              );
            })}
          </View>
          {isSettled && drawnDice && allReelsLocked && (
            <View style={styles.sumPill}>
              <Text style={styles.sumPillText}>SUM = {drawnDice[0] + drawnDice[1] + drawnDice[2]}</Text>
            </View>
          )}
          {isDrawing && <Text style={styles.drawingLabel}>ROLLING...</Text>}
        </View>

        <View style={styles.infoRow}>
          <Pressable style={styles.infoChip} onPress={() => rootNavigation.navigate('HonorRanking')}>
            <Ionicons name="trophy" size={14} color={palette.amberDeep} />
          </Pressable>
          {totalPool != null && (
            <View style={styles.poolChip}>
              <Text style={styles.poolLabel}>POOL</Text>
              <Text style={styles.poolValue}>{totalPool.toLocaleString()}</Text>
            </View>
          )}
          <LinearGradient colors={[palette.sky, palette.skyDeep]} style={styles.timerChip}>
            <Text style={styles.timerLabel}>
              {isOpen ? 'CLOSES IN' : isDrawing ? 'ROLLING' : isSettled ? 'SETTLED' : 'WAITING'}
            </Text>
            <Text style={styles.timerValue}>
              {isOpen ? `${secondsToLock}s` : isDrawing ? '···' : isSettled ? '✓' : '—'}
            </Text>
          </LinearGradient>
          <Pressable style={styles.infoChip} onPress={() => setIsHistoryOpen(true)}>
            <Ionicons name="time-outline" size={14} color={palette.amberDeep} />
          </Pressable>
        </View>

        {streakSummary && (
          <Text style={styles.streakText}>
            RECENT <Text style={styles.streakValue}>{streakSummary}</Text>
          </Text>
        )}

        <View style={styles.shortcutRow}>
          {(['S', 'B', 'E', 'O'] as const).map((key) => {
            const numbers = key === 'S' ? smallNumbers() : key === 'B' ? bigNumbers() : key === 'E' ? evenNumbers() : oddNumbers();
            const isActive = selected.size === numbers.length && numbers.every((n) => selected.has(n));
            return (
              <PressableScale key={key} onPress={() => applyShortcut(numbers)} style={styles.shortcutButtonWrap}>
                {isActive ? (
                  <LinearGradient colors={[palette.sky, palette.skyDeep]} style={styles.shortcutButton}>
                    <Text style={styles.shortcutTextActive}>{key}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.shortcutButton, styles.shortcutButtonInactive]}>
                    <Text style={styles.shortcutText}>{key}</Text>
                  </View>
                )}
              </PressableScale>
            );
          })}
          <PressableScale onPress={() => setSelected(new Set())} style={styles.shortcutButtonWrap}>
            <View style={[styles.shortcutButton, styles.shortcutButtonInactive]}>
              <Text style={styles.shortcutText}>CLR</Text>
            </View>
          </PressableScale>
        </View>

        <View style={styles.numberGrid}>
          {NUMBERS.map((n) => {
            const isSelected = selected.has(n);
            const isWinner = isSettled && allReelsLocked && drawnDice && drawnDice[0] + drawnDice[1] + drawnDice[2] === n;
            const poolAmount = poolQuery.data?.applicable ? poolQuery.data.pool[n] : undefined;
            const barRatio = poolAmount ? Math.min(1, poolAmount / maxPoolValue) : 0;
            const content = (
              <>
                <View style={styles.numberShine} />
                <Text style={[styles.numberText, (isSelected || isWinner) && styles.numberTextOnColor]}>{n}</Text>
                {!!poolAmount && <Text style={[styles.poolAmountText, (isSelected || isWinner) && styles.numberTextOnColor]}>{poolAmount}</Text>}
                {!!poolAmount && (
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${barRatio * 100}%` }]} />
                  </View>
                )}
              </>
            );
            return (
              <Pressable key={n} disabled={!isOpen} onPress={() => toggleNumber(n)} style={styles.numberWrap}>
                {isSelected ? (
                  <LinearGradient colors={[palette.sky, palette.skyDeep]} style={styles.number}>
                    {content}
                  </LinearGradient>
                ) : isWinner ? (
                  <LinearGradient colors={[palette.emerald, palette.emeraldDeep]} style={[styles.number, styles.numberWinner]}>
                    {content}
                  </LinearGradient>
                ) : (
                  <View style={[styles.number, styles.numberInactive]}>{content}</View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.walletRow}>
          <Ionicons name="ellipse" size={8} color={palette.amber} />
          <Text style={styles.walletCoin}>{walletCoins}</Text>
        </View>
        <View style={styles.betRow}>
          <Pressable style={styles.stepButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStakeValue((v) => Math.max(MIN_STAKE, v - STAKE_STEP)); }}>
            <Ionicons name="remove" size={18} color={palette.textPrimary} />
          </Pressable>
          <PressableScale disabled={!canBet || placeMutation.isPending} onPress={() => placeMutation.mutate()} style={styles.betButtonWrap}>
            <LinearGradient
              colors={canBet ? [palette.amberBright, palette.amber] : ['#E2E8F0', '#CBD5E1']}
              style={styles.betButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.betButtonShine} />
              <Text style={[styles.betButtonText, !canBet && styles.betButtonTextDisabled]}>
                {placeMutation.isPending ? 'PLACING...' : `BET ${stakeValue}`}
              </Text>
            </LinearGradient>
          </PressableScale>
          <Pressable style={styles.stepButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStakeValue((v) => v + STAKE_STEP); }}>
            <Ionicons name="add" size={18} color={palette.textPrimary} />
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={isHistoryOpen} animationType="slide" onRequestClose={() => setIsHistoryOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.historySheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recent Results</Text>
              <Pressable onPress={() => setIsHistoryOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color={palette.textPrimary} />
              </Pressable>
            </View>
            {historyQuery.isLoading ? (
              <ActivityIndicator color={palette.skyDeep} style={{ marginVertical: spacing.lg }} />
            ) : (historyQuery.data ?? []).filter((r) => r.result?.sum != null).length === 0 ? (
              <Text style={styles.historyEmpty}>No settled rounds yet.</Text>
            ) : (
              <ScrollView>
                {(historyQuery.data ?? []).map((row) => {
                  const sum = row.result?.sum;
                  if (sum == null) return null;
                  return (
                    <View key={row.roundId} style={styles.historyRow}>
                      <Text style={styles.historyTime}>{row.settledAt ? new Date(row.settledAt).toLocaleTimeString() : '—'}</Text>
                      <Text style={styles.historySum}>{sum}</Text>
                      <Text style={styles.historyClass}>
                        {sum < 14 ? 'S' : 'B'}/{sum % 2 === 0 ? 'E' : 'O'}
                      </Text>
                      <Text style={styles.historyPrize}>{row.prize ?? 0}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.md, paddingBottom: 140 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.bgPanel,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.slateBevel,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  wordmarkWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { color: palette.textPrimary, fontSize: 17, fontWeight: '800' },
  reelCapsule: {
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: palette.bgPanel,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: palette.cyan,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: palette.cyanDeep,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  reelCapsuleShine: {
    position: 'absolute',
    top: 6,
    left: 24,
    right: 24,
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  reelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reelDivider: { width: 2, height: 34, backgroundColor: palette.border, borderRadius: 1 },
  reelSlot: {
    width: 56,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
  },
  reelDigit: { color: palette.skyDeep, fontSize: 30, fontWeight: '900' },
  sumPill: {
    marginTop: 14,
    backgroundColor: palette.amberBright,
    borderWidth: 1,
    borderColor: palette.amber,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  sumPillText: { color: palette.amberDeep, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  drawingLabel: { color: palette.skyDeep, fontWeight: '800', letterSpacing: 2, marginTop: 14, fontSize: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  infoChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.bgPanel,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poolChip: {
    flex: 1,
    backgroundColor: palette.bgPanel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  poolLabel: { color: palette.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  poolValue: { color: palette.skyDeep, fontSize: 14, fontWeight: '800', marginTop: 1 },
  timerChip: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'flex-end' },
  timerLabel: { color: 'rgba(255,255,255,.85)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  timerValue: { color: '#FFF', fontSize: 14, fontWeight: '800', marginTop: 1 },
  streakText: { color: palette.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: spacing.sm },
  streakValue: { color: palette.skyDeep, fontWeight: '800' },
  shortcutRow: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  shortcutButtonWrap: { flex: 1 },
  shortcutButton: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  shortcutButtonInactive: { backgroundColor: palette.bgPanel, borderWidth: 1, borderColor: palette.border },
  shortcutText: { color: palette.textSecondary, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  shortcutTextActive: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  numberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  numberWrap: { width: '13%', aspectRatio: 0.9 },
  number: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: palette.slateBevel,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 0,
    elevation: 3,
  },
  numberInactive: { backgroundColor: palette.bgPanel },
  numberWinner: { shadowColor: palette.emeraldDeep, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 },
  numberShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '35%', backgroundColor: 'rgba(255,255,255,.5)' },
  numberText: { color: palette.textPrimary, fontSize: 15, fontWeight: '800' },
  numberTextOnColor: { color: '#FFFFFF' },
  poolAmountText: { color: palette.textSecondary, fontSize: 8, fontWeight: '700', marginTop: 1 },
  miniTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(0,0,0,.08)' },
  miniFill: { height: '100%', backgroundColor: palette.amber },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.bgPanel,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    shadowColor: palette.slateBevel,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 8,
    elevation: 10,
  },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  walletCoin: { color: palette.amberDeep, fontWeight: '800', fontSize: 13 },
  betRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betButtonWrap: { flex: 1, borderRadius: 12, overflow: 'hidden', shadowColor: palette.amberDeep, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 6 },
  betButton: { height: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  betButtonShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,.3)' },
  betButtonText: { color: palette.amberDeep, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  betButtonTextDisabled: { color: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,41,59,.5)', justifyContent: 'flex-end' },
  historySheet: { backgroundColor: palette.bgPanel, borderTopWidth: 1, borderColor: palette.border, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.md, minHeight: 200, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: '800' },
  modalClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: palette.bgCard, alignItems: 'center', justifyContent: 'center' },
  historyEmpty: { color: palette.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.border },
  historyTime: { color: palette.textSecondary, fontSize: 11, flex: 1 },
  historySum: { color: palette.textPrimary, fontWeight: '800', width: 30, textAlign: 'center' },
  historyClass: { color: palette.textSecondary, fontSize: 11, width: 40, textAlign: 'center' },
  historyPrize: { color: palette.amberDeep, fontWeight: '800', width: 50, textAlign: 'right' },
});
