import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchWatchHistory } from '../../api/live';
import { GradientBackground } from '../../components/GradientBackground';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

// Real — built from LiveViewer rows that trackViewerJoin has been
// writing every time someone actually joins a live session, since that
// feature was added earlier in this project. Not a new tracking system;
// this screen is the first thing that actually reads that data. Tapping
// a still-live session opens it; an ended one just shows as history,
// since there's nothing live to rejoin.
export function WatchHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();

  const historyQuery = useQuery({ queryKey: ['live', 'history'], queryFn: fetchWatchHistory });

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Watch History</Text>
      </View>

      {historyQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={historyQuery.data ?? []}
          keyExtractor={(item) => item.sessionId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <FadeInUp index={0} style={styles.emptyState}>
              <Ionicons name="time-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>You haven't watched any live sessions yet.</Text>
            </FadeInUp>
          }
          renderItem={({ item, index }) => {
            const isLive = item.status === 'LIVE';
            return (
              <FadeInUp index={index} style={styles.row}>
                <Pressable
                  style={styles.rowContent}
                  disabled={!isLive}
                  onPress={() => isLive && navigation.navigate('LiveViewer', { sessionId: item.sessionId })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.hostName}>{item.hostDisplayName ?? 'Unknown host'}</Text>
                  </View>
                  {isLive && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                  <Text style={styles.watchedAt}>{new Date(item.watchedAt).toLocaleDateString()}</Text>
                </Pressable>
              </FadeInUp>
            );
          }}
        />
      )}
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
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.xs },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  sessionTitle: { ...type.bodyStrong, color: colors.textPrimary },
  hostName: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  liveBadge: { backgroundColor: colors.danger, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 },
  liveBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  watchedAt: { ...type.caption, color: colors.textMuted },
  emptyState: { alignItems: 'center', marginTop: spacing.xl },
  emptyText: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
});
