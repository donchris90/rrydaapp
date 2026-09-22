import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../auth/AuthContext';

interface Props {
  onOpenEdit: () => void;
  onOpenKyc: () => void;
}

export const ProfileCompletionIndicator: React.FC<Props> = ({ onOpenEdit, onOpenKyc }) => {
  const { palette } = useTheme();
  const { user } = useAuth();
  const styles = makeStyles(palette);

  // Four equally weighted steps, all read from the real account. `action` is
  // where "Complete Now" goes; the bio is edited inline on the card below, so
  // it has none.
  const steps = useMemo(
    () => [
      { key: 'name', done: !!user?.displayName?.trim(), hint: 'Add a display name', action: onOpenEdit },
      { key: 'avatar', done: !!user?.avatarUrl, hint: 'Add a profile photo', action: onOpenEdit },
      { key: 'bio', done: !!user?.bio?.trim(), hint: 'Add a bio in the card below', action: undefined },
      { key: 'kyc', done: !!user?.kycVerified, hint: 'Verify your identity', action: onOpenKyc },
    ],
    [user?.displayName, user?.avatarUrl, user?.bio, user?.kycVerified, onOpenEdit, onOpenKyc],
  );
  const percentage = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
  const next = steps.find((s) => !s.done);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="sparkles" size={16} color="#FF2E7E" />
          <Text style={styles.title}>Profile Completion</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{percentage}%</Text>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <LinearGradient
          colors={['#FF2E7E', '#FF5E98']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percentage}%` }]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.subtext}>{next ? `Next: ${next.hint}` : 'Your profile is complete'}</Text>
        {next?.action && (
          <Pressable onPress={next.action} style={styles.actionBtn}>
            <Text style={styles.actionText}>Complete Now</Text>
            <Ionicons name="arrow-forward" size={12} color="#FFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEDF6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#221F33',
  },
  badge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF2E7E',
  },
  track: {
    height: 8,
    backgroundColor: '#F1EEFA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtext: {
    fontSize: 11,
    color: '#9490A6',
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF2E7E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
