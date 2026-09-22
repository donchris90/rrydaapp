import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPkHistory, type PkHistoryEntry } from '../../api/pk';
import { GradientBackground } from '../../components/GradientBackground';
import { colors, radii, spacing, type } from '../../theme';

const PAGE_SIZE = 20;

const RESULT_STYLE: Record<PkHistoryEntry['result'], { label: string; color: string }> = {
  WIN: { label: 'WIN', color: '#10B981' },
  LOSS: { label: 'LOSS', color: '#EF4444' },
  DRAW: { label: 'DRAW', color: '#9CA3AF' },
};

const fmt = (v: string | number) => Number(v).toLocaleString('en-US');

// The caller's settled PK battles, newest first, with their overall record.
// Backed by GET /pk/history (record comes with every page; it's the overall
// tally, not the loaded rows).
export function PkHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const query = useInfiniteQuery({
    queryKey: ['pk', 'history'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchPkHistory({ limit: PAGE_SIZE, before: pageParam }),
    // A short page means there is nothing older.
    getNextPageParam: (lastPage) =>
      lastPage.battles.length === PAGE_SIZE ? (lastPage.battles[lastPage.battles.length - 1].settledAt ?? undefined) : undefined,
  });

  const battles = query.data?.pages.flatMap((p) => p.battles) ?? [];
  const record = query.data?.pages[0]?.record;
  const total = record ? record.wins + record.losses + record.draws : 0;
  const winRate = record && total > 0 ? Math.round((record.wins / total) * 100) : null;

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>PK History</Text>
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.body}>Could not load your PK history.</Text>
          <Pressable onPress={() => query.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={battles}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={
            record ? (
              <View style={styles.recordCard}>
                <Stat label="Wins" value={String(record.wins)} color="#10B981" />
                <Stat label="Losses" value={String(record.losses)} color="#EF4444" />
                <Stat label="Draws" value={String(record.draws)} color={colors.textSecondary} />
                <Stat label="Win rate" value={winRate === null ? '—' : `${winRate}%`} color={colors.textPrimary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => <BattleRow battle={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="flash-outline" size={32} color={colors.textMuted} />
              <Text style={styles.body}>No finished battles yet.</Text>
            </View>
          }
          ListFooterComponent={
            query.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.md }} /> : null
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </GradientBackground>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BattleRow({ battle }: { battle: PkHistoryEntry }) {
  const result = RESULT_STYLE[battle.result];
  return (
    <View style={styles.row}>
      <View style={[styles.pill, { backgroundColor: `${result.color}22` }]}>
        <Text style={[styles.pillText, { color: result.color }]}>{result.label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.opponent} numberOfLines={1}>
          vs {battle.opponentDisplayName ?? 'Unknown'}
        </Text>
        <Text style={styles.date}>{battle.settledAt ? new Date(battle.settledAt).toLocaleString() : ''}</Text>
      </View>
      <Text style={styles.score}>
        {fmt(battle.myScore)} – {fmt(battle.opponentScore)}
      </Text>
    </View>
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
  center: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  body: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  retry: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised },
  retryText: { ...type.bodyStrong, color: colors.textPrimary },
  recordCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...type.h2 },
  statLabel: { ...type.caption, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.pill, minWidth: 52, alignItems: 'center' },
  pillText: { ...type.caption, fontWeight: '800' },
  opponent: { ...type.bodyStrong, color: colors.textPrimary },
  date: { ...type.caption, color: colors.textMuted },
  score: { ...type.bodyStrong, color: colors.textPrimary },
});
