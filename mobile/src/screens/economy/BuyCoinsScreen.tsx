import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { fetchCoinPackages, fetchPaymentMethods, fetchPurchaseStatus, purchaseCoins } from '../../api/coins';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { FadeInUp } from '../../components/FadeInUp';
import { PressableScale } from '../../components/PressableScale';
import { colors, radii, spacing, type } from '../../theme';

// Buying coins: pick a package, pay on the provider's hosted page (Paystack:
// card, bank transfer or USSD), and the coins arrive when Paystack's signed
// webhook confirms the payment. The app never decides a payment succeeded; it
// only opens the payment page and then watches the purchase's status.
export function BuyCoinsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const paystack = (methodsQuery.data ?? []).find((m) => m.id === 'PAYSTACK');

  const packagesQuery = useQuery({
    queryKey: ['coins', 'packages', user?.countryCode],
    queryFn: () => fetchCoinPackages(user?.countryCode ?? 'NG'),
    enabled: !!user?.countryCode,
  });

  const methodsQuery = useQuery({ queryKey: ['coins', 'payment-methods'], queryFn: fetchPaymentMethods });

  // A purchase we sent the person off to pay for, and are now waiting on.
  const [waitingFor, setWaitingFor] = useState<string | null>(null);
  const pollUntil = useRef(0);

  useEffect(() => {
    if (!waitingFor) return;
    pollUntil.current = Date.now() + 3 * 60 * 1000;
    let cancelled = false;
    const check = async () => {
      try {
        const p = await fetchPurchaseStatus(waitingFor);
        if (cancelled) return;
        if (p.status === 'CONFIRMED') {
          setWaitingFor(null);
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          Alert.alert('Payment received', `${p.coinAmount.toLocaleString()} coins were added to your balance.`);
        } else if (p.status === 'FAILED') {
          setWaitingFor(null);
          Alert.alert('Payment failed', 'The payment did not go through, and you were not charged for coins. Please try again.');
        } else if (Date.now() > pollUntil.current) {
          setWaitingFor(null);
          Alert.alert('Still waiting', 'We have not received confirmation yet. If you paid, your coins will be added automatically as soon as the payment clears.');
        }
      } catch {
        /* a failed poll is retried on the next tick */
      }
    };
    const interval = setInterval(check, 3000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check()); // back from the payment page
    check();
    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  }, [waitingFor, queryClient]);

  const purchaseMutation = useMutation({
    mutationFn: (packageId: string) => purchaseCoins(packageId, Crypto.randomUUID()),
    onSuccess: async (result) => {
      if (!result.checkoutUrl) {
        Alert.alert('Payments unavailable', "This server isn't connected to a payment provider yet, so this purchase can't be completed.");
        return;
      }
      setWaitingFor(result.id);
      try {
        await Linking.openURL(result.checkoutUrl);
      } catch {
        setWaitingFor(null);
        Alert.alert("Couldn't open the payment page", 'Please try again.');
      }
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

      {/* Payment rails are country-configured by Admin. Non-Paystack rails remain visibly unavailable until their transaction workflows are connected. */}
      <View style={styles.methods}>
        {(methodsQuery.data ?? []).map((m) => (
          <View key={m.id} style={[styles.method, m.available && styles.methodActive, !m.available && { opacity: 0.55 }]}>
            <Text style={styles.methodName}>{m.name}</Text>
            <Text style={styles.methodNote}>{m.comingSoon ? 'Coming soon' : m.available ? m.description : 'Unavailable'}</Text>
          </View>
        ))}
      </View>

      {waitingFor && (
        <View style={styles.waiting}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.waitingText}>Waiting for your payment to be confirmed…</Text>
        </View>
      )}

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
            label={purchaseMutation.isPending ? 'Opening payment page...' : waitingFor ? 'Waiting for payment…' : paystack?.available ? 'Pay with Paystack' : 'Payment unavailable'}
            onPress={() => selectedId && !waitingFor && paystack?.available && purchaseMutation.mutate(selectedId)}
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
  methods: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  method: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.sm },
  methodActive: { borderColor: colors.primary },
  methodName: { ...type.bodyStrong, color: colors.textPrimary },
  methodNote: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  waitingText: { ...type.caption, color: colors.textSecondary },
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
