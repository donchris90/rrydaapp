import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { applyToBeCreator, fetchCreatorDashboard, requestWithdrawal } from '../../api/creators';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// Real, but genuinely partial — see creators.controller.ts's own comment
// on dashboard(): live hours, viewers, followers-gained, and gift
// breakdown aren't built yet, only the withdrawable balance is. And per
// withdrawal.service.ts, KYC/payout-account integration isn't built
// either — a withdrawal request here is really recorded and reserved
// against real balance, but there's no real payment rail connected to
// actually pay it out yet. Both limitations are shown in the UI rather
// than left implicit.
export function CreatorCenterScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const isCreator = user?.roles?.some((r) => r.role === 'CREATOR') ?? false;

  const dashboardQuery = useQuery({
    queryKey: ['creators', 'dashboard'],
    queryFn: fetchCreatorDashboard,
    enabled: isCreator,
  });

  const applyMutation = useMutation({
    mutationFn: applyToBeCreator,
    onSuccess: (application) => {
      Alert.alert('Application submitted', `Status: ${application.status}. You'll be able to withdraw earnings once approved.`);
    },
    onError: (error: any) => {
      Alert.alert('Could not apply', error?.response?.data?.message ?? 'Something went wrong. Try again.');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (amountCoins: number) => requestWithdrawal(amountCoins, 'NGN', Crypto.randomUUID()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators', 'dashboard'] });
      setWithdrawAmount('');
      Alert.alert('Withdrawal requested', 'Your request has been recorded and the amount reserved from your earnings.');
    },
    onError: (error: any) => {
      Alert.alert('Could not withdraw', error?.response?.data?.message ?? 'Something went wrong. Try again.');
    },
  });

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Streamer Center</Text>
      </View>

      {!isCreator ? (
        <FadeInUp index={0} style={styles.card}>
          <Ionicons name="tv-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Become a creator</Text>
          <Text style={styles.emptyBody}>
            Apply to unlock creator earnings and withdrawals. An admin reviews applications — approval isn't instant.
          </Text>
          <View style={{ marginTop: spacing.md, width: '100%' }}>
            <GradientButton
              label={applyMutation.isPending ? 'Applying...' : 'Apply now'}
              onPress={() => applyMutation.mutate()}
              loading={applyMutation.isPending}
            />
          </View>
        </FadeInUp>
      ) : dashboardQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <FadeInUp index={0} style={styles.card}>
            <Text style={styles.label}>Withdrawable balance</Text>
            <Text style={styles.balance}>{dashboardQuery.data?.withdrawableBalance ?? '0'} coins</Text>
            <Text style={styles.note}>
              Live hours, viewers, and gift-breakdown analytics aren't tracked yet — this balance is the one real number available today.
            </Text>
          </FadeInUp>

          <FadeInUp index={1} style={styles.card}>
            <Text style={styles.label}>Request a withdrawal</Text>
            <TextInput
              style={styles.input}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="Amount in coins"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
            <Text style={styles.note}>
              This reserves the amount against your balance and records a real request — payout processing (bank transfer, KYC
              verification) isn't connected to a real payment method yet, so nothing is actually paid out automatically.
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <GradientButton
                label={withdrawMutation.isPending ? 'Requesting...' : 'Request withdrawal'}
                onPress={() => {
                  const amount = parseInt(withdrawAmount, 10);
                  if (!amount || amount <= 0) {
                    Alert.alert('Enter an amount', 'Type how many coins you want to withdraw first.');
                    return;
                  }
                  withdrawMutation.mutate(amount);
                }}
                loading={withdrawMutation.isPending}
              />
            </View>
          </FadeInUp>
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
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: { ...type.h2, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center' },
  emptyBody: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  label: { ...type.caption, color: colors.textSecondary, alignSelf: 'flex-start', fontWeight: '700' },
  balance: { ...type.h1, color: colors.gold, alignSelf: 'flex-start', marginTop: spacing.xs },
  note: { ...type.caption, color: colors.textMuted, marginTop: spacing.sm, alignSelf: 'flex-start' },
  input: {
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
});
