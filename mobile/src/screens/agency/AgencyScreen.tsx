import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAgencyDashboard, fetchMyAgency } from '../../api/agencies';
import { requestWithdrawal, type CreatorPeriod } from '../../api/creators';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { FadeInUp } from '../../components/FadeInUp';
import { WithdrawPanel } from '../../components/WithdrawPanel';
import { PayoutHistoryList } from '../../components/PayoutHistoryList';
import { colors, radii, spacing, type } from '../../theme';

const PERIODS: { id: CreatorPeriod; label: string; long: string }[] = [
  { id: 'today', label: '24h', long: 'Last 24 hours' },
  { id: 'week', label: '7 days', long: 'Last 7 days' },
  { id: 'month', label: '30 days', long: 'Last 30 days' },
];

const fmt = (n: number | string) => Number(n).toLocaleString('en-US');

// Two roles can land here, and one user can be both:
//  - a creator recruited into an agency (GET /agencies/me): read-only status;
//  - an agency's owner (GET /agencies/me/dashboard): commission earned, the
//    withdrawable agency balance, member performance and a payout box that
//    draws on the AGENCY_EARNINGS wallet.
// There is still no self-serve "apply to join an agency" flow — agencies
// recruit creators directly (POST /agencies/:id/creators).
export function AgencyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<CreatorPeriod>('week');

  const membershipQuery = useQuery({ queryKey: ['agencies', 'me'], queryFn: fetchMyAgency });
  const ownerQuery = useQuery({
    queryKey: ['agencies', 'me', 'dashboard', period],
    queryFn: () => fetchAgencyDashboard(period),
  });

  const membership = membershipQuery.data;
  const owner = ownerQuery.data;
  const stillLoading = membershipQuery.isLoading || ownerQuery.isLoading;
  const periodLabel = PERIODS.find((p) => p.id === period)?.long ?? '';

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Agency</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        {stillLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {membership && (
              <FadeInUp index={0} style={styles.card}>
                <Text style={styles.agencyName}>{membership.agencyName}</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={styles.value}>{membership.status}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Commission</Text>
                  <Text style={styles.value}>{(membership.commissionBps / 100).toFixed(2)}%</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Joined</Text>
                  <Text style={styles.value}>{new Date(membership.joinedAt).toLocaleDateString()}</Text>
                </View>
              </FadeInUp>
            )}

            {owner && (
              <>
                <FadeInUp index={1} style={styles.card}>
                  <Text style={styles.agencyName}>{owner.agency.name}</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Agency status</Text>
                    <Text style={styles.value}>{owner.agency.status}</Text>
                  </View>

                  <View style={styles.chips}>
                    {PERIODS.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => setPeriod(p.id)}
                        style={[styles.chip, period === p.id && styles.chipActive]}
                      >
                        <Text style={period === p.id ? styles.chipActiveText : styles.chipText}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Commission earned ({periodLabel})</Text>
                    <Text style={styles.value}>{fmt(owner.commissionCoins)} coins</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Withdrawable balance</Text>
                    <Text style={styles.value}>{fmt(owner.withdrawableBalance)} coins</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Active creators</Text>
                    <Text style={styles.value}>{owner.memberCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Gifts to your creators</Text>
                    <Text style={styles.value}>{fmt(owner.memberGiftCoins)} coins</Text>
                  </View>
                </FadeInUp>

                <FadeInUp index={2} style={styles.card}>
                  <Text style={styles.sectionTitle}>Creators</Text>
                  {owner.members.length === 0 ? (
                    <Text style={styles.emptyBody}>No active creators yet.</Text>
                  ) : (
                    owner.members.map((m) => (
                      <View key={m.creatorId} style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.value}>{m.displayName ?? 'Unnamed'}</Text>
                          <Text style={styles.label}>{(m.commissionBps / 100).toFixed(2)}% commission</Text>
                        </View>
                        <Text style={styles.value}>{fmt(m.giftCoins)}</Text>
                      </View>
                    ))
                  )}
                </FadeInUp>

                <FadeInUp index={3} style={styles.card}>
                  <Text style={styles.sectionTitle}>Withdraw agency earnings</Text>
                  {owner.agency.status !== 'APPROVED' ? (
                    <Text style={styles.emptyBody}>Available once your agency is approved.</Text>
                  ) : (
                    <WithdrawPanel walletType="AGENCY_EARNINGS" balanceCoins={owner.withdrawableBalance} />
                  )}
                  <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Payout history</Text>
                  <PayoutHistoryList walletType="AGENCY_EARNINGS" />
                </FadeInUp>
              </>
            )}

            {!membership && !owner && (
              <FadeInUp index={0} style={styles.card}>
                <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>You're not in an agency yet</Text>
                <Text style={styles.emptyBody}>
                  Agencies recruit creators directly. Once one adds you, it'll show up here.
                </Text>
              </FadeInUp>
            )}
          </>
        )}
      </ScrollView>
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
  agencyName: { ...type.h1, color: colors.textPrimary, alignSelf: 'flex-start', marginBottom: spacing.sm },
  sectionTitle: { ...type.h2, color: colors.textPrimary, alignSelf: 'flex-start', marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  label: { ...type.body, color: colors.textSecondary },
  value: { ...type.bodyStrong, color: colors.textPrimary },
  chips: { flexDirection: 'row', gap: spacing.xs, alignSelf: 'flex-start', marginVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...type.caption, color: colors.textSecondary, fontWeight: '800' },
  chipActiveText: { ...type.caption, color: colors.textPrimary, fontWeight: '800' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...type.h2, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center' },
  emptyBody: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
});
