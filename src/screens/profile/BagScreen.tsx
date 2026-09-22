import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchBackpack, type BackpackDay } from '../../api/gifts';
import { GradientBackground } from '../../components/GradientBackground';
import { colors, radii, spacing, type } from '../../theme';

const DAYS = 7;

function dayTitle(day: BackpackDay): string {
  if (day.isToday) return 'Today';
  const d = new Date(`${day.date}T12:00:00Z`);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
  if (day.date === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

// The backpack: the gifts you RECEIVED, one day at a time — today first, then the
// days before — with how many of each, what they were worth, and who sent them.
// (Received gifts show here instead of as notifications or in the header banner.)
export function BagScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: ['gifts', 'backpack'], queryFn: () => fetchBackpack(DAYS), refetchOnMount: 'always' });
  const days = query.data ?? [];
  // Today always shows (even when empty); earlier days only when something arrived.
  const shown = days.filter((d) => d.isToday || d.totalCount > 0);

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Backpack</Text>
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : query.isError ? (
        <Text style={styles.emptyText}>Could not load your backpack. Go back and try again.</Text>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}>
          {shown.map((day) => (
            <View key={day.date} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{dayTitle(day)}</Text>
                {day.totalCount > 0 && (
                  <Text style={styles.dayTotal}>
                    {day.totalCount} gift{day.totalCount === 1 ? '' : 's'} · {day.totalCoins.toLocaleString()} coins
                  </Text>
                )}
              </View>

              {day.gifts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="gift-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No gifts received today yet.</Text>
                </View>
              ) : (
                day.gifts.map((g) => (
                  <View key={g.giftId} style={styles.giftRow}>
                    <View style={styles.giftIconWrap}>{g.icon ? <Text style={{ fontSize: 26 }}>{g.icon}</Text> : <Ionicons name="gift" size={22} color={colors.pink} />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.giftName}>
                        {g.name} <Text style={styles.giftCount}>×{g.count}</Text>
                      </Text>
                      <Text style={styles.senders} numberOfLines={2}>
                        From {g.senders.map((s) => `${s.displayName ?? 'Someone'}${s.count > 1 ? ` ×${s.count}` : ''}`).join(', ')}
                      </Text>
                    </View>
                    <Text style={styles.giftValue}>{g.coinValue.toLocaleString()}</Text>
                  </View>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.h2, color: colors.textPrimary },
  list: { paddingHorizontal: spacing.md, gap: spacing.md },
  dayBlock: { gap: spacing.xs },
  dayHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  dayTitle: { ...type.bodyStrong, fontSize: 17, color: colors.textPrimary },
  dayTotal: { ...type.caption, color: colors.textSecondary },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: spacing.md },
  giftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.sm },
  giftIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  giftName: { ...type.bodyStrong, color: colors.textPrimary },
  giftCount: { color: colors.pink, fontWeight: '900' },
  senders: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  giftValue: { ...type.bodyStrong, color: colors.gold },
});
