import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from '../../api/feed';
import type { LeaderboardRow } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { hubColors, hubGradients, hubTint } from '../../theme';
import { Avatar } from '../Avatar';
import { PressableScale } from '../PressableScale';

const PODIUM_GRADIENTS = [hubGradients.goldPodium, hubGradients.silverPodium, hubGradients.bronzePodium];
const PODIUM_BORDER = [hubColors.amber500, hubColors.textMuted, hubColors.amber600];
const PODIUM_BADGE_BG = [hubColors.amber400, hubColors.textFaint, hubColors.amber600];

// Ports rryda-games-hub's TopPlayersLeaderboard.tsx, but reading real COIN
// wallet standings from GET /wallet/leaderboard instead of the reference's
// two fake ALL_TIME_PLAYERS / WEEKLY_PLAYERS arrays — see
// wallet.service.ts's leaderboard() for what 'all' vs 'weekly' actually
// measure. There's no per-player "favorite game" or custom badge in real
// data, so those are replaced with the server-computed coin `tier` label.
export function TopPlayersLeaderboard({
  onSelectGame,
  onOpenProfile,
}: {
  onSelectGame: () => void;
  onOpenProfile: () => void;
}) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'all' | 'weekly'>('all');

  const query = useQuery({
    queryKey: ['wallet', 'leaderboard', period],
    queryFn: () => fetchLeaderboard(period),
  });

  const top = (query.data?.top ?? []).slice(0, 7);
  const podium = top.slice(0, 3);
  const rest = top.slice(3, 7);
  const meRank = query.data?.me?.rank ?? null;
  const meCoins = query.data?.me?.coins ?? '0';
  const userInTop = user ? top.some((p) => p.userId === user.id) : true;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="trophy" size={18} color={hubColors.amber400} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Top Players Leaderboard</Text>
              <View style={styles.highScoreBadge}>
                <Text style={styles.highScoreBadgeText}>High Scores</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Rankings based on total coin balances & lifetime earnings</Text>
          </View>
        </View>
      </View>

      <View style={styles.timeframeTrack}>
        <PressableScale style={[styles.timeframeButton, period === 'all' && styles.timeframeButtonActive]} onPress={() => setPeriod('all')}>
          <Text style={[styles.timeframeText, period === 'all' && styles.timeframeTextActive]}>All-Time</Text>
        </PressableScale>
        <PressableScale style={[styles.timeframeButton, period === 'weekly' && styles.timeframeButtonActive]} onPress={() => setPeriod('weekly')}>
          <Text style={[styles.timeframeText, period === 'weekly' && styles.timeframeTextActive]}>Weekly</Text>
        </PressableScale>
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={hubColors.amber400} style={{ marginVertical: 20 }} />
      ) : top.length === 0 ? (
        <Text style={styles.emptyText}>No ranked players yet — be the first to earn coins!</Text>
      ) : (
        <>
          <View style={styles.podiumRow}>
            {podium.map((player, idx) => (
              <PodiumCard key={player.userId} player={player} idx={idx} isMe={player.userId === user?.id} />
            ))}
          </View>

          <View style={styles.listCard}>
            {rest.map((player, i) => (
              <RankRow key={player.userId} player={player} isMe={player.userId === user?.id} isLast={i === rest.length - 1 && userInTop} />
            ))}

            {!userInTop && meRank !== null && (
              <View style={styles.meStrip}>
                <View style={styles.meStripLeft}>
                  <View style={styles.meRankBadge}>
                    <Text style={styles.meRankBadgeText}>YOUR RANK: #{meRank}</Text>
                  </View>
                  <Avatar name={user?.displayName} imageUrl={user?.avatarUrl} size={20} ring={false} />
                  <Text style={styles.meStripName} numberOfLines={1}>
                    {user?.displayName ?? user?.email ?? 'You'}
                  </Text>
                </View>
                <View style={styles.meStripRight}>
                  <View style={styles.coinRow}>
                    <Text style={styles.coinIcon}>🪙</Text>
                    <Text style={styles.meStripCoins}>{Number(meCoins).toLocaleString()}</Text>
                  </View>
                  <PressableScale style={styles.statsButton} onPress={onOpenProfile}>
                    <Text style={styles.statsButtonText}>My Stats</Text>
                  </PressableScale>
                  <PressableScale style={styles.climbButton} onPress={onSelectGame}>
                    <Text style={styles.climbButtonText}>Climb Ranks</Text>
                    <Ionicons name="arrow-up" size={11} color={hubColors.bg} />
                  </PressableScale>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Ionicons name="shield-checkmark" size={13} color={hubColors.emerald400} />
          <Text style={styles.footerText}>Verified Arcade High Scores</Text>
        </View>
        <Text style={styles.footerSeason}>
          Season 1 <Text style={styles.footerSeasonAccent}>• Live Coins Ranking</Text>
        </Text>
      </View>
    </View>
  );
}

function PodiumCard({ player, idx, isMe }: { player: LeaderboardRow; idx: number; isMe: boolean }) {
  return (
    <View style={[styles.podiumCard, { borderColor: PODIUM_BORDER[idx] }, isMe && styles.podiumCardMe]}>
      <LinearGradient colors={PODIUM_GRADIENTS[idx]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={styles.podiumLeft}>
        <View style={[styles.rankBadge, { backgroundColor: PODIUM_BADGE_BG[idx] }]}>
          <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
        </View>
        <View style={{ flexShrink: 1 }}>
          <View style={styles.podiumNameRow}>
            <Avatar name={player.displayName} imageUrl={player.avatarUrl} size={20} ring={false} />
            <Text style={styles.podiumName} numberOfLines={1}>
              {player.displayName ?? 'Player'}
            </Text>
            {isMe && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={styles.podiumTier}>{player.tier}</Text>
        </View>
      </View>
      <View style={styles.podiumRight}>
        <View style={styles.coinRow}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.podiumCoins}>{Number(player.coins).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

function RankRow({ player, isMe, isLast }: { player: LeaderboardRow; isMe: boolean; isLast: boolean }) {
  return (
    <View style={[styles.rankRow, !isLast && styles.rankRowDivider, isMe && styles.rankRowMe]}>
      <View style={styles.rankRowLeft}>
        <Text style={styles.rankRowNumber}>#{player.rank}</Text>
        <Avatar name={player.displayName} imageUrl={player.avatarUrl} size={22} ring={false} />
        <Text style={styles.rankRowName} numberOfLines={1}>
          {player.displayName ?? 'Player'}
        </Text>
        {isMe && (
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>YOU</Text>
          </View>
        )}
      </View>
      <View style={styles.coinRow}>
        <Text style={styles.coinIcon}>🪙</Text>
        <Text style={styles.rankRowCoins}>{Number(player.coins).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: hubColors.panel,
    borderWidth: 1,
    borderColor: hubColors.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  headerRow: { borderBottomWidth: 1, borderBottomColor: hubColors.borderLight, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: hubTint.amber15,
    borderWidth: 1,
    borderColor: hubTint.amber30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  highScoreBadge: {
    backgroundColor: hubTint.amber20,
    borderWidth: 1,
    borderColor: hubTint.amber30,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  highScoreBadgeText: { color: hubColors.amber300, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { color: hubColors.textSecondary, fontSize: 11, marginTop: 2 },
  timeframeTrack: {
    flexDirection: 'row',
    backgroundColor: hubColors.surfaceSunken,
    borderWidth: 1,
    borderColor: hubColors.border,
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  timeframeButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  timeframeButtonActive: { backgroundColor: hubColors.border },
  timeframeText: { color: hubColors.textSecondary, fontWeight: '700', fontSize: 12 },
  timeframeTextActive: { color: '#FFFFFF' },
  emptyText: { color: hubColors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  podiumRow: { gap: 8 },
  podiumCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  podiumCardMe: { borderColor: hubColors.amber400, borderWidth: 2 },
  podiumLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  rankBadge: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rankBadgeText: { color: hubColors.bg, fontWeight: '900', fontSize: 11 },
  podiumNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  podiumName: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, maxWidth: 110 },
  podiumTier: { color: hubColors.textSecondary, fontSize: 10, marginTop: 1 },
  podiumRight: { alignItems: 'flex-end' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coinIcon: { fontSize: 11 },
  podiumCoins: { color: hubColors.amber300, fontWeight: '900', fontSize: 12 },
  youBadge: { backgroundColor: hubColors.amber400, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  youBadgeText: { color: hubColors.bg, fontSize: 8, fontWeight: '900' },
  listCard: {
    backgroundColor: hubColors.surfaceSunken,
    borderWidth: 1,
    borderColor: hubColors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rankRowDivider: { borderBottomWidth: 1, borderBottomColor: hubColors.borderLight },
  rankRowMe: { backgroundColor: hubTint.amber15, borderLeftWidth: 3, borderLeftColor: hubColors.amber400 },
  rankRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  rankRowNumber: { color: hubColors.textMuted, fontWeight: '700', fontSize: 11, width: 20 },
  rankRowName: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, maxWidth: 120 },
  rankRowCoins: { color: hubColors.amber300, fontWeight: '800', fontSize: 12 },
  meStrip: {
    padding: 12,
    borderTopWidth: 2,
    borderTopColor: hubTint.amber30,
    backgroundColor: hubTint.amber10,
    gap: 10,
  },
  meStripLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  meRankBadge: { backgroundColor: hubColors.amber400, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  meRankBadgeText: { color: hubColors.bg, fontWeight: '900', fontSize: 10 },
  meStripName: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, maxWidth: 140 },
  meStripRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  meStripCoins: { color: hubColors.amber300, fontWeight: '900', fontSize: 12 },
  statsButton: { backgroundColor: hubColors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statsButtonText: { color: hubColors.amber300, fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  climbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: hubColors.amber400,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  climbButtonText: { color: hubColors.bg, fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: hubColors.textMuted, fontSize: 10 },
  footerSeason: { color: hubColors.textMuted, fontSize: 10 },
  footerSeasonAccent: { color: hubColors.amber400, fontWeight: '700' },
});
