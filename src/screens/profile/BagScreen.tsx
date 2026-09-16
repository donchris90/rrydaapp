import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchReceivedGifts } from '../../api/gifts';
import { GradientBackground } from '../../components/GradientBackground';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// Real — aggregated from actual GiftTransaction rows where you're the
// recipient (gift.service.ts's received()), not a fabricated inventory
// system. Shows what you've actually been sent and its real coin value,
// grouped by gift type rather than a potentially huge flat transaction log.
export function BagScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const receivedQuery = useQuery({ queryKey: ['gifts', 'received'], queryFn: fetchReceivedGifts });

  const totalValue = receivedQuery.data?.reduce((sum, g) => sum + g.totalCoinValue, 0) ?? 0;

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Bag</Text>
      </View>

      {receivedQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {receivedQuery.data && receivedQuery.data.length > 0 && (
            <FadeInUp index={0} style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total gift value received</Text>
              <Text style={styles.totalValue}>{totalValue.toLocaleString()} coins</Text>
            </FadeInUp>
          )}

          <FlatList
            data={receivedQuery.data ?? []}
            keyExtractor={(g) => g.giftId}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <FadeInUp index={0} style={styles.emptyState}>
                <Ionicons name="gift-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No gifts received yet.</Text>
              </FadeInUp>
            }
            renderItem={({ item, index }) => (
              <FadeInUp index={index + 1} style={styles.giftRow}>
                <View style={styles.giftIconWrap}>
                  <Ionicons name="gift" size={20} color={colors.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.giftName}>{item.giftName}</Text>
                  <Text style={styles.giftCount}>x{item.count}</Text>
                </View>
                <Text style={styles.giftValue}>{item.totalCoinValue.toLocaleString()}</Text>
              </FadeInUp>
            )}
          />
        </>
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
  totalCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
  },
  totalLabel: { ...type.caption, color: colors.textSecondary, fontWeight: '700' },
  totalValue: { ...type.h1, color: colors.gold, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  giftIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftName: { ...type.bodyStrong, color: colors.textPrimary },
  giftCount: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  giftValue: { ...type.bodyStrong, color: colors.gold },
  emptyState: { alignItems: 'center', marginTop: spacing.xl },
  emptyText: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
});
