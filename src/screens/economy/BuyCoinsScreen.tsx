import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { fetchCoinPackages, purchaseCoins } from '../../api/coins';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { FadeInUp } from '../../components/FadeInUp';
import { PressableScale } from '../../components/PressableScale';
import { colors, radii, spacing, type } from '../../theme';

// Was flagged as an open gap since early in this project — the coin
// purchase backend (real Paystack integration, real package catalog)
// existed with no way to reach it from the app at all. This is that
// screen: real packages, real purchase initiation. What happens after
// initiate() depends on the configured PaymentProvider — in a real
// production setup this would open a payment page and confirm via
// webhook; there's no in-app payment UI here, since building that is a
// distinct, larger task from just exposing the existing endpoints.
export function BuyCoinsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const packagesQuery = useQuery({
    queryKey: ['coins', 'packages', user?.countryCode],
    queryFn: () => fetchCoinPackages(user?.countryCode ?? 'NG'),
    enabled: !!user?.countryCode,
  });

  const purchaseMutation = useMutation({
    mutationFn: (packageId: string) => purchaseCoins(packageId, Crypto.randomUUID()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert(
        'Purchase initiated',
        `Status: ${result.status}. Depending on how your payment provider is configured, this may need a confirmation step before coins actually land in your wallet.`,
      );
    },
    onError: (error: any) => {
      Alert.alert('Purchase failed', error?.response?.data?.message ?? 'Something went wrong. Try again.');
    },
  });

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Buy Coins</Text>
      </View>

      {packagesQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : packagesQuery.data && packagesQuery.data.length > 0 ? (
        <View style={styles.list}>
          {packagesQuery.data.map((pkg, i) => {
            const isSelected = selectedId === pkg.id;
            return (
              <FadeInUp key={pkg.id} index={i}>
                <PressableScale
                  style={[styles.packageRow, isSelected && styles.packageRowSelected]}
                  onPress={() => setSelectedId(pkg.id)}
                >
                  <View style={styles.coinIconWrap}>
                    <Ionicons name="ellipse" size={20} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.coinAmount}>{pkg.coinAmount.toLocaleString()} coins</Text>
                    <Text style={styles.price}>{pkg.price}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </PressableScale>
              </FadeInUp>
            );
          })}
        </View>
      ) : (
        <FadeInUp index={0} style={styles.emptyState}>
          <Ionicons name="cart-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No coin packages are available for your region yet.</Text>
        </FadeInUp>
      )}

      {packagesQuery.data && packagesQuery.data.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <GradientButton
            label={purchaseMutation.isPending ? 'Processing...' : 'Buy now'}
            onPress={() => selectedId && purchaseMutation.mutate(selectedId)}
            loading={purchaseMutation.isPending}
          />
        </View>
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
  list: { paddingHorizontal: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  packageRowSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  coinIconWrap: { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  coinAmount: { ...type.bodyStrong, color: colors.textPrimary },
  price: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  emptyText: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
