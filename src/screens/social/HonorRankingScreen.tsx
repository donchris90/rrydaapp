import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchHonorRanking } from '../../api/ranking';
import type { HonorRankingEntry } from '../../api/types';
import { countryCodeToFlag } from '../../utils/country';
import { GradientBackground } from '../../components/GradientBackground';
import { Avatar } from '../../components/Avatar';
import { PressableScale } from '../../components/PressableScale';
import { FadeInUp } from '../../components/FadeInUp';
import { SkeletonRow } from '../../components/Skeleton';
import { colors, radii, spacing, type } from '../../theme';

type Period = 'today' | 'week';

const MEDAL_COLORS = [colors.gold, '#C7CAD9', '#D8934B'] as const;

// Real gift totals from GiftController#ranking — see backend's
// GiftService.ranking. "Honor" here means exactly one thing: coins
// received as gifts in the window, nothing fabricated on top of it.
export function HonorRankingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('today');

  const rankingQuery = useQuery({
    queryKey: ['ranking', 'honor', period],
    queryFn: () => fetchHonorRanking(period),
  });

  const renderRow = ({ item, index }: { item: HonorRankingEntry; index: number }) => (
    <FadeInUp index={index} style={styles.row}>
      <View style={styles.rankWrap}>
        {index < 3 ? (
          <Ionicons name="trophy" size={18} color={MEDAL_COLORS[index]} />
        ) : (
          <Text style={styles.rankNumber}>{index + 1}</Text>
        )}
      </View>
      <Avatar name={item.displayName} size={44} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.displayName ?? 'Unnamed user'}
        </Text>
        <Text style={styles.flag}>{countryCodeToFlag(item.countryCode)}</Text>
      </View>
      <View style={styles.scoreWrap}>
        <Ionicons name="diamond" size={14} color={colors.gold} />
        <Text style={styles.score}>{item.honorScore.toLocaleString()}</Text>
      </View>
    </FadeInUp>
  );

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Honor Ranking</Text>
      </View>

      <View style={styles.periodRow}>
        <PressableScale
          style={[styles.periodChip, period === 'today' && styles.periodChipActive]}
          onPress={() => setPeriod('today')}
        >
          <Text style={[styles.periodText, period === 'today' && styles.periodTextActive]}>Today</Text>
        </PressableScale>
        <PressableScale
          style={[styles.periodChip, period === 'week' && styles.periodChipActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>This Week</Text>
        </PressableScale>
      </View>

      {rankingQuery.isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (rankingQuery.data?.length ?? 0) === 0 ? (
        <FadeInUp index={0} style={styles.emptyWrap}>
          <Text style={styles.empty}>No gifts sent in this window yet.</Text>
        </FadeInUp>
      ) : (
        <FlatList
          data={rankingQuery.data}
          keyExtractor={(item) => item.userId}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: { marginRight: spacing.sm },
  title: { ...type.h1, color: colors.textPrimary },
  periodRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  periodChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  periodChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  periodText: { ...type.caption, color: colors.textSecondary },
  periodTextActive: { color: colors.textOnLight },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  skeletons: { paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rankWrap: { width: 24, alignItems: 'center' },
  rankNumber: { ...type.bodyStrong, color: colors.textSecondary },
  info: { flex: 1 },
  name: { ...type.bodyStrong, color: colors.textPrimary },
  flag: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  score: { ...type.bodyStrong, color: colors.gold },
  emptyWrap: { marginHorizontal: spacing.md, marginTop: spacing.lg },
  empty: { color: colors.textSecondary, textAlign: 'center' },
});
