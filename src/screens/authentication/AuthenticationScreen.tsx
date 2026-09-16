import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// Read-only status display. users.service.ts's setKycVerified is
// deliberately admin-only ("No verification provider integrated — this
// just records the outcome of a KYC check done elsewhere") — there's no
// self-serve "submit your ID" flow to build here yet, so this screen
// doesn't pretend one exists.
export function AuthenticationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const verified = user?.kycVerified ?? false;

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Authentication</Text>
      </View>

      <FadeInUp index={0} style={styles.card}>
        <Ionicons
          name={verified ? 'checkmark-circle' : 'time-outline'}
          size={40}
          color={verified ? colors.success : colors.textMuted}
        />
        <Text style={styles.status}>{verified ? 'Verified' : 'Not verified yet'}</Text>
        <Text style={styles.body}>
          {verified
            ? 'Your identity has been verified.'
            : "Identity verification isn't self-serve yet — this updates once your account has been reviewed."}
        </Text>
      </FadeInUp>
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
  status: { ...type.h2, color: colors.textPrimary, marginTop: spacing.sm },
  body: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
});
