import React from 'react';
import { FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { fetchMyReferrals } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// Real, end to end: a real referralCode generated at registration
// (auth.service.ts), a real GET /users/me/referrals list, and a real
// 100-coin bonus credited to both sides on signup (see
// REFERRAL_BONUS_COINS in auth.service.ts) — not just a code sitting
// there unused. There's no deep-linking scheme configured in this app
// (checked app.json), so sharing sends the code as plain text for
// someone to type in manually during registration, not a tappable link.
export function InviteScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const referralsQuery = useQuery({ queryKey: ['users', 'me', 'referrals'], queryFn: fetchMyReferrals });

  const handleShare = () => {
    Share.share({
      message: `Join me on the app! Use my invite code ${user?.referralCode} when you sign up and we'll both get a coin bonus.`,
    }).catch(() => {});
  };

  const handleCopy = () => {
    if (user?.referralCode) Clipboard.setStringAsync(user.referralCode);
  };

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Invite Friends</Text>
      </View>

      <FadeInUp index={0} style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your invite code</Text>
        <Pressable onPress={handleCopy} style={styles.codeRow}>
          <Text style={styles.code}>{user?.referralCode ?? '—'}</Text>
          <Ionicons name="copy-outline" size={18} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.hint}>Both of you get 100 coins when a friend signs up with your code.</Text>
        <View style={{ marginTop: spacing.md, width: '100%' }}>
          <GradientButton label="Share invite" onPress={handleShare} />
        </View>
      </FadeInUp>

      <Text style={styles.sectionTitle}>People you've invited ({referralsQuery.data?.length ?? 0})</Text>
      <FlatList
        data={referralsQuery.data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !referralsQuery.isLoading ? (
            <FadeInUp index={1} style={styles.emptyState}>
              <Ionicons name="people-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No one has used your code yet.</Text>
            </FadeInUp>
          ) : null
        }
        renderItem={({ item, index }) => (
          <FadeInUp index={index} style={styles.referralRow}>
            <Text style={styles.referralName}>{item.displayName ?? 'A new user'}</Text>
            <Text style={styles.referralDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </FadeInUp>
        )}
      />
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
  codeCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
  },
  codeLabel: { ...type.caption, color: colors.textSecondary, fontWeight: '700' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  code: { ...type.display, color: colors.gold, letterSpacing: 2 },
  hint: { ...type.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  sectionTitle: { ...type.bodyStrong, color: colors.textPrimary, marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs },
  referralRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  referralName: { ...type.body, color: colors.textPrimary },
  referralDate: { ...type.caption, color: colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyText: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
});
