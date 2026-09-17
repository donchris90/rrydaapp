import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { fetchRounds, fetchBigWins, type BigWin, type GameRound } from '../../api/games';
import { fetchWallet } from '../../api/feed';
import { fetchCheckInStatus, performCheckIn } from '../../api/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, type } from '../../theme';
import { PressableScale } from '../../components/PressableScale';
import { FadeInUp } from '../../components/FadeInUp';

type Props = NativeStackScreenProps<AppStackParamList, 'GameCenter'>;

// Visual language adapted directly from the rryda-games-hub web reference
// (GamesHub.tsx) — the near-black slate cards, emerald identity for
// Crash, amber identity for Lucky Number — kept local to this screen the
// same way CrashScreen and SumDiceScreen each keep their own accent
// object rather than bending the shared purple theme to match one
// screen. What's NOT carried over from that reference: its fake "1,842
// Playing" counters, its rotating fake @handle winners ticker, and its
// localStorage-backed fake profile/leaderboard — this screen only shows
// numbers a real endpoint returned.
const accent = {
  bg: '#0B0F17',
  panel: '#111724',
  panelAlt: '#141822',
  border: '#232B3A',
  borderStrong: 'rgba(255,255,255,0.10)',
  textDim: '#8A93A6',
  crash: '#22D3A5',
  crashDeep: '#0EA96B',
  crashWash: 'rgba(34, 211, 165, 0.12)',
  lucky: '#F5B93D',
  luckyDeep: '#D98E1A',
  luckyWash: 'rgba(245, 185, 61, 0.12)',
  locked: '#6C7A94',
};

type CategoryKey = 'ALL' | 'CRASH' | 'DICE' | 'ARCADE';
const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'ALL', label: '🔥 All Games' },
  { key: 'CRASH', label: '🚀 Crash' },
  { key: 'DICE', label: '🎲 Live Dice' },
  { key: 'ARCADE', label: '🕹️ Arcade' },
];

function roundStatusCopy(round: GameRound | undefined, liveText: string, waitingText: string) {
  if (!round) return { text: 'No round right now', dotColor: accent.locked, pulsing: false };
  if (round.status === 'LOCKED') return { text: liveText, dotColor: accent.crash, pulsing: true };
  if (round.status === 'OPEN') return { text: waitingText, dotColor: accent.lucky, pulsing: true };
  return { text: 'Starting soon', dotColor: accent.locked, pulsing: false };
}

export function GameCenterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<CategoryKey>('ALL');
  const [winnerIdx, setWinnerIdx] = useState(0);

  const walletQuery = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const coins = Number(walletQuery.data?.coin ?? 0);

  const crashRoundsQuery = useQuery({ queryKey: ['games', 'CRASH', 'rounds'], queryFn: () => fetchRounds('CRASH'), refetchInterval: 4000 });
  const diceRoundsQuery = useQuery({ queryKey: ['games', 'SUM_DICE', 'rounds'], queryFn: () => fetchRounds('SUM_DICE'), refetchInterval: 4000 });
  const crashRound = crashRoundsQuery.data?.[0];
  const diceRound = diceRoundsQuery.data?.[0];

  const crashWinsQuery = useQuery({ queryKey: ['games', 'CRASH', 'bigWins'], queryFn: () => fetchBigWins('CRASH'), refetchInterval: 15000 });
  const diceWinsQuery = useQuery({ queryKey: ['games', 'SUM_DICE', 'bigWins'], queryFn: () => fetchBigWins('SUM_DICE'), refetchInterval: 15000 });

  // Merge both games' real big wins into one ticker, newest first — no
  // fake handles are attached; see BigWin's doc comment for why.
  const winners = useMemo(() => {
    const tagged: Array<BigWin & { game: 'Crash' | 'Lucky Number'; icon: string; multiplier: number }> = [
      ...(crashWinsQuery.data ?? []).map((w) => ({ ...w, game: 'Crash' as const, icon: '🚀', multiplier: w.coinAmount ? w.rewardAmount / w.coinAmount : 0 })),
      ...(diceWinsQuery.data ?? []).map((w) => ({ ...w, game: 'Lucky Number' as const, icon: '🎲', multiplier: w.coinAmount ? w.rewardAmount / w.coinAmount : 0 })),
    ];
    return tagged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [crashWinsQuery.data, diceWinsQuery.data]);

  useEffect(() => {
    if (winners.length < 2) return;
    const id = setInterval(() => setWinnerIdx((prev) => (prev + 1) % winners.length), 3200);
    return () => clearInterval(id);
  }, [winners.length]);

  const currentWinner = winners[winnerIdx % Math.max(winners.length, 1)];

  const queryClient = useQueryClient();
  const checkInQuery = useQuery({ queryKey: ['checkIn'], queryFn: fetchCheckInStatus });
  const checkInMutation = useMutation({
    mutationFn: performCheckIn,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['checkIn'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const crashStatus = roundStatusCopy(crashRound, 'Live Round In Progress', 'Betting Open — place your bet');
  const diceStatus = roundStatusCopy(diceRound, 'Live Draw In Progress', 'Betting Open — place your bet');

  const showCrash = category === 'ALL' || category === 'CRASH';
  const showDice = category === 'ALL' || category === 'DICE';
  const showArcade = category === 'ALL' || category === 'ARCADE';

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.sm }]}>
        <FadeInUp index={0}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Game Center</Text>
            <View style={styles.walletChip}>
              <Ionicons name="logo-bitcoin" size={14} color={colors.gold} />
              <Text style={styles.walletChipText}>{coins.toLocaleString()}</Text>
            </View>
          </View>
        </FadeInUp>

        {/* Live wins ticker — real settled entries, rotated client-side */}
        {currentWinner && (
          <FadeInUp index={1}>
            <View style={styles.ticker}>
              <View style={styles.tickerLeft}>
                <Ionicons name="trophy" size={13} color={colors.gold} />
                <Text style={styles.tickerLabel}>LIVE BIG WINS</Text>
              </View>
              <View style={styles.tickerMiddle}>
                <Text style={styles.tickerIcon}>{currentWinner.icon}</Text>
                <Text style={styles.tickerText} numberOfLines={1}>
                  {currentWinner.game} win · <Text style={styles.tickerAmount}>+{currentWinner.rewardAmount.toLocaleString()}</Text>
                </Text>
                <View style={styles.tickerMultBadge}>
                  <Text style={styles.tickerMultText}>{currentWinner.multiplier.toFixed(1)}x</Text>
                </View>
              </View>
            </View>
          </FadeInUp>
        )}

        {/* Hero banners */}
        <View style={styles.heroRow}>
          {showCrash && (
            <FadeInUp index={2} style={{ flex: 1 }}>
              <PressableScale style={[styles.heroCard, { borderColor: 'rgba(34,211,165,0.35)' }]} onPress={() => navigation.navigate('CrashGame')}>
                <LinearGradient colors={['#101927', '#0B1320', '#070B13']} style={StyleSheet.absoluteFill} />
                <View style={styles.heroTopRow}>
                  <View style={[styles.pill, { backgroundColor: accent.crashWash, borderColor: 'rgba(34,211,165,0.4)' }]}>
                    <Ionicons name="flame" size={11} color={accent.crash} />
                    <Text style={[styles.pillText, { color: accent.crash }]}>CRASH</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>CRASH MULTIPLIER</Text>
                <Text style={styles.heroSub}>Cash out before the rocket busts.</Text>
                <View style={styles.heroFooterRow}>
                  <View style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: crashStatus.dotColor }]} />
                    <Text style={styles.statusText}>{crashStatus.text}</Text>
                  </View>
                  <View style={[styles.playButton, { backgroundColor: accent.crash }]}>
                    <Ionicons name="play" size={12} color="#04150F" />
                    <Text style={styles.playButtonText}>Play</Text>
                  </View>
                </View>
              </PressableScale>
            </FadeInUp>
          )}

          {showDice && (
            <FadeInUp index={3} style={{ flex: 1 }}>
              <PressableScale style={[styles.heroCard, { borderColor: 'rgba(245,185,61,0.35)' }]} onPress={() => navigation.navigate('SumDice')}>
                <LinearGradient colors={['#201026', '#170A20', '#0D0513']} style={StyleSheet.absoluteFill} />
                <View style={styles.heroTopRow}>
                  <View style={[styles.pill, { backgroundColor: accent.luckyWash, borderColor: 'rgba(245,185,61,0.4)' }]}>
                    <Ionicons name="dice" size={11} color={accent.lucky} />
                    <Text style={[styles.pillText, { color: accent.lucky }]}>LUCKY NUMBER</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>LUCKY NUMBER</Text>
                <Text style={styles.heroSub}>Pick numbers or S/B/E/O — 3-dice sum draw.</Text>
                <View style={styles.heroFooterRow}>
                  <View style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: diceStatus.dotColor }]} />
                    <Text style={styles.statusText}>{diceStatus.text}</Text>
                  </View>
                  <View style={[styles.playButton, { backgroundColor: accent.lucky }]}>
                    <Ionicons name="play" size={12} color="#241300" />
                    <Text style={styles.playButtonText}>Play</Text>
                  </View>
                </View>
              </PressableScale>
            </FadeInUp>
          )}
        </View>

        {/* Category tabs — a client-side filter over the same two real games */}
        <FadeInUp index={4}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {CATEGORIES.map((cat) => (
              <PressableScale
                key={cat.key}
                style={[styles.tab, category === cat.key && styles.tabActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.key); }}
              >
                <Text style={[styles.tabText, category === cat.key && styles.tabTextActive]}>{cat.label}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        </FadeInUp>

        {/* Game grid */}
        <View style={styles.grid}>
          {showCrash && (
            <FadeInUp index={5} style={styles.gridItem}>
              <PressableScale style={styles.gameCard} onPress={() => navigation.navigate('CrashGame')}>
                <View style={[styles.gameThumb, { backgroundColor: '#0C1822' }]}>
                  <Text style={{ fontSize: 30 }}>🚀</Text>
                  {crashRound?.status === 'LOCKED' ? (
                    <Text style={[styles.gameThumbCaption, { color: accent.crash }]}>Live now</Text>
                  ) : (
                    <Text style={styles.gameThumbCaption}>{crashStatus.text}</Text>
                  )}
                </View>
                <Text style={styles.gameCardTitle}>Crash Multiplier</Text>
                <Text style={styles.gameCardDesc}>Real-time curve, manual or auto cash-out.</Text>
                <View style={styles.gameCardFooter}>
                  <Text style={[styles.gameCardTag, { color: accent.crash }]}>Provably fair</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                </View>
              </PressableScale>
            </FadeInUp>
          )}

          {showDice && (
            <FadeInUp index={6} style={styles.gridItem}>
              <PressableScale style={styles.gameCard} onPress={() => navigation.navigate('SumDice')}>
                <View style={[styles.gameThumb, { backgroundColor: '#1A0F2E' }]}>
                  <Text style={{ fontSize: 26 }}>🎲🎲🎲</Text>
                  <Text style={[styles.gameThumbCaption, { color: accent.lucky }]}>
                    {diceRound?.status === 'LOCKED' ? 'Drawing now' : diceStatus.text}
                  </Text>
                </View>
                <Text style={styles.gameCardTitle}>Lucky Number</Text>
                <Text style={styles.gameCardDesc}>Big/Small/Odd/Even plus exact-number picks.</Text>
                <View style={styles.gameCardFooter}>
                  <Text style={[styles.gameCardTag, { color: accent.lucky }]}>Provably fair</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                </View>
              </PressableScale>
            </FadeInUp>
          )}

          {showArcade && (
            <FadeInUp index={7} style={styles.gridItem}>
              <View style={[styles.gameCard, styles.gameCardDisabled]}>
                <View style={[styles.gameThumb, { backgroundColor: '#12142D' }]}>
                  <Text style={{ fontSize: 28 }}>🎡</Text>
                </View>
                <Text style={styles.gameCardTitle}>Fortune Wheel</Text>
                <Text style={styles.gameCardDesc}>Spin the prize wheel — coming soon.</Text>
                <View style={styles.gameCardFooter}>
                  <Text style={styles.gameCardTagMuted}>Coming soon</Text>
                </View>
              </View>
            </FadeInUp>
          )}
        </View>

        {/* Daily bonus — real check-in streak/reward, not a fabricated amount */}
        {checkInQuery.data && (
          <FadeInUp index={8}>
            <View style={styles.bonusCard}>
              <View style={styles.bonusLeft}>
                <View style={styles.bonusIcon}>
                  <Text style={{ fontSize: 22 }}>🎁</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bonusTitle}>Daily Check-In</Text>
                  <Text style={styles.bonusSub}>
                    {checkInQuery.data.alreadyCheckedInToday
                      ? `Checked in today — streak ${checkInQuery.data.streak} day${checkInQuery.data.streak === 1 ? '' : 's'}.`
                      : `+${checkInQuery.data.nextRewardCoins.toLocaleString()} coins for streak day ${checkInQuery.data.streak + 1}.`}
                  </Text>
                </View>
              </View>
              <PressableScale
                style={[styles.claimButton, (checkInQuery.data.alreadyCheckedInToday || checkInMutation.isPending) && styles.claimButtonDisabled]}
                disabled={checkInQuery.data.alreadyCheckedInToday || checkInMutation.isPending}
                onPress={() => checkInMutation.mutate()}
              >
                <Text style={styles.claimButtonText}>
                  {checkInQuery.data.alreadyCheckedInToday ? 'Claimed' : checkInMutation.isPending ? 'Claiming…' : 'Claim'}
                </Text>
              </PressableScale>
            </View>
          </FadeInUp>
        )}

        {/* Trust footer — real architectural facts about this system */}
        <FadeInUp index={9}>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Ionicons name="shield-checkmark" size={14} color={accent.crash} />
              <Text style={styles.footerText}>Commit–reveal provably fair rounds</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="sync" size={14} color={accent.lucky} />
              <Text style={styles.footerText}>Server-authoritative round state</Text>
            </View>
          </View>
        </FadeInUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: accent.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  headerTitle: { ...type.display, color: colors.textPrimary },
  walletChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: accent.panel, borderWidth: 1, borderColor: accent.border,
    borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  walletChipText: { color: colors.gold, fontWeight: '800', fontSize: 12 },

  ticker: {
    backgroundColor: accent.panel, borderWidth: 1, borderColor: accent.border,
    borderRadius: radii.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
  },
  tickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tickerLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tickerMiddle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  tickerIcon: { fontSize: 14 },
  tickerText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  tickerAmount: { color: accent.crash, fontWeight: '800' },
  tickerMultBadge: { backgroundColor: accent.crashWash, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tickerMultText: { color: accent.crash, fontSize: 10, fontWeight: '900' },

  heroRow: { flexDirection: 'row', gap: spacing.sm },
  heroCard: {
    minHeight: 168, borderRadius: radii.lg, borderWidth: 1, padding: spacing.md,
    justifyContent: 'space-between', overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1,
    borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  pillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  heroTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900', marginTop: spacing.sm },
  heroSub: { color: accent.textDim, fontSize: 11, marginTop: 4, lineHeight: 15 },
  heroFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: accent.border },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', flexShrink: 1 },
  playButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 6 },
  playButtonText: { fontSize: 10, fontWeight: '900', color: '#04150F' },

  tabRow: { gap: spacing.xs, paddingVertical: 2 },
  tab: { paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: accent.panelAlt, borderWidth: 1, borderColor: accent.border },
  tabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#241300' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { width: '47%' },
  gameCard: { backgroundColor: accent.panel, borderWidth: 1, borderColor: accent.border, borderRadius: radii.lg, padding: spacing.sm },
  gameCardDisabled: { opacity: 0.6 },
  gameThumb: { height: 84, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs, gap: 2 },
  gameThumbCaption: { fontSize: 10, fontWeight: '800', color: colors.textSecondary },
  gameCardTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 13 },
  gameCardDesc: { color: accent.textDim, fontSize: 10, marginTop: 2, lineHeight: 13 },
  gameCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: accent.border },
  gameCardTag: { fontSize: 10, fontWeight: '800' },
  gameCardTagMuted: { fontSize: 10, fontWeight: '700', color: accent.locked },

  bonusCard: {
    backgroundColor: accent.panel, borderWidth: 1, borderColor: accent.border, borderRadius: radii.lg,
    padding: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
  },
  bonusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  bonusIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: accent.luckyWash, alignItems: 'center', justifyContent: 'center' },
  bonusTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 13 },
  bonusSub: { color: accent.textDim, fontSize: 11, marginTop: 2 },
  claimButton: { backgroundColor: colors.gold, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
  claimButtonDisabled: { backgroundColor: accent.panelAlt },
  claimButtonText: { color: '#241300', fontWeight: '900', fontSize: 12 },

  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: accent.border },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { color: accent.textDim, fontSize: 10, fontWeight: '600' },
});
