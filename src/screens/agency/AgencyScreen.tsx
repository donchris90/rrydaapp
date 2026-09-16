import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchMyAgency } from '../../api/agencies';
import { GradientBackground } from '../../components/GradientBackground';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// Backed by GET /agencies/me (agencies.controller.ts). Agency
// registration/creator-recruitment already exist on the backend but only
// as agency-owner actions (POST /agencies, POST /agencies/:id/creators) —
// there's no self-serve "apply to join an agency" flow yet, so this
// screen only shows status, it doesn't offer to join one.
export function AgencyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const agencyQuery = useQuery({ queryKey: ['agencies', 'me'], queryFn: fetchMyAgency });

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Agency</Text>
      </View>

      {agencyQuery.isLoading ? null : agencyQuery.data ? (
        <FadeInUp index={0} style={styles.card}>
          <Text style={styles.agencyName}>{agencyQuery.data.agencyName}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{agencyQuery.data.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Commission</Text>
            <Text style={styles.value}>{(agencyQuery.data.commissionBps / 100).toFixed(2)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Joined</Text>
            <Text style={styles.value}>{new Date(agencyQuery.data.joinedAt).toLocaleDateString()}</Text>
          </View>
        </FadeInUp>
      ) : (
        <FadeInUp index={0} style={styles.card}>
          <Ionicons name="people-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>You're not in an agency yet</Text>
          <Text style={styles.emptyBody}>
            Agencies recruit creators directly. Once one adds you, it'll show up here.
          </Text>
        </FadeInUp>
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
  agencyName: { ...type.h1, color: colors.textPrimary, alignSelf: 'flex-start', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  label: { ...type.body, color: colors.textSecondary },
  value: { ...type.bodyStrong, color: colors.textPrimary },
  emptyTitle: { ...type.h2, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center' },
  emptyBody: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
});
