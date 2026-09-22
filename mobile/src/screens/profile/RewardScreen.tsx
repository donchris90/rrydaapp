import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCheckInStatus, performCheckIn } from '../../api/auth';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// Real, disclosed formula (see users.service.ts's computeCheckInReward):
// 10 coins per streak day, capped at a 7-day streak (70 coins max).
// "Today" is a UTC calendar day, not a rolling 24h window — check in any
// time Tuesday, eligible again any time Wednesday.
export function RewardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({ queryKey: ['users', 'me', 'check-in'], queryFn: fetchCheckInStatus });

  const checkInMutation = useMutation({
    mutationFn: performCheckIn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'check-in'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert('Checked in!', `You earned ${result.rewardCoins} coins. Streak: ${result.streak} day${result.streak === 1 ? '' : 's'}.`);
    },
    onError: (error: any) => {
      Alert.alert('Could not check in', error?.response?.data?.message ?? 'Something went wrong. Try again.');
    },
  });

  const streakDays = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Daily Reward</Text>
      </View>

      {statusQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FadeInUp index={0} style={styles.card}>
          <Ionicons name="gift" size={32} color={colors.gold} />
          <Text style={styles.streakLabel}>Current streak</Text>
          <Text style={styles.streakValue}>{statusQuery.data?.streak ?? 0} day{statusQuery.data?.streak === 1 ? '' : 's'}</Text>

          <View style={styles.streakRow}>
            {streakDays.map((day) => {
              const isFilled = (statusQuery.data?.streak ?? 0) >= day;
              return (
                <View key={day} style={[styles.streakDot, isFilled && styles.streakDotFilled]}>
                  <Text style={[styles.streakDotText, isFilled && styles.streakDotTextFilled]}>{day}</Text>
                </View>
              );
            })}
          </View>

          {statusQuery.data?.alreadyCheckedInToday ? (
            <Text style={styles.doneText}>You've already checked in today — come back tomorrow.</Text>
          ) : (
            <View style={{ width: '100%', marginTop: spacing.md }}>
              <GradientButton
                label={checkInMutation.isPending ? 'Checking in...' : `Check in for ${statusQuery.data?.nextRewardCoins ?? 0} coins`}
                onPress={() => checkInMutation.mutate()}
                loading={checkInMutation.isPending}
              />
            </View>
          )}
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
  streakLabel: { ...type.caption, color: colors.textSecondary, fontWeight: '700', marginTop: spacing.sm },
  streakValue: { ...type.h1, color: colors.textPrimary, marginTop: spacing.xs },
  streakRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  streakDot: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDotFilled: { backgroundColor: colors.gold, borderColor: colors.gold },
  streakDotText: { ...type.caption, color: colors.textMuted, fontWeight: '700' },
  streakDotTextFilled: { color: colors.textOnLight },
  doneText: { ...type.body, color: colors.textSecondary, marginTop: spacing.lg, textAlign: 'center' },
});
