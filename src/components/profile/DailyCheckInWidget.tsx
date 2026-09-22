import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import type { DailyReward } from './DailyRewardModal';

interface DailyCheckInWidgetProps {
  rewards: DailyReward[];
  streak: number;
  onOpenFullModal: () => void;
  onClaimToday: () => void;
}

export const DailyCheckInWidget: React.FC<DailyCheckInWidgetProps> = ({ rewards, streak, onOpenFullModal, onClaimToday }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const currentReward = rewards.find((r) => r.isCurrent);
  const hasUnclaimedToday = Boolean(currentReward && !currentReward.isClaimed);

  return (
    <View style={[styles.container, hasUnclaimedToday && styles.containerActive]}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <View style={[styles.iconBox, hasUnclaimedToday && styles.iconBoxActive]}>
            <Ionicons name="gift" size={18} color={hasUnclaimedToday ? '#FFFFFF' : '#B45309'} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Daily Check-in</Text>
              <View style={styles.streakPill}>
                <Ionicons name="flame" size={10} color="#E11D48" />
                <Text style={styles.streakText}>{streak}d</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {hasUnclaimedToday ? `Day ${currentReward?.day} reward is ready` : 'Reward claimed today'}
            </Text>
          </View>
        </View>
        <Pressable onPress={onOpenFullModal} hitSlop={8} style={styles.calendarLink}>
          <Text style={styles.calendarLinkText}>Calendar</Text>
          <Ionicons name="chevron-forward" size={13} color="#7C3AED" />
        </Pressable>
      </View>

      <View style={styles.track}>
        {(Array.isArray(rewards) ? rewards : []).map((reward) => (
          <Pressable
            key={reward.day}
            onPress={() => (reward.isCurrent && !reward.isClaimed ? onClaimToday() : onOpenFullModal())}
            style={[styles.dayCell, reward.isClaimed && styles.dayCellClaimed, reward.isCurrent && styles.dayCellCurrent]}
          >
            <Text style={styles.dayLabel}>D{reward.day}</Text>
            {reward.isClaimed ? (
              <View style={styles.doneCircle}>
                <Ionicons name="checkmark" size={9} color="#FFFFFF" />
              </View>
            ) : (
              <Text style={styles.dayCoins}>+{reward.coins}</Text>
            )}
          </Pressable>
        ))}
      </View>

      {hasUnclaimedToday && (
        <Pressable style={styles.claimBar} onPress={onClaimToday}>
          <Ionicons name="sparkles" size={13} color="#FFFFFF" />
          <Text style={styles.claimBarText}>Claim +{currentReward?.coins} Coins</Text>
        </Pressable>
      )}
    </View>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  container: { borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, padding: 14, gap: 12 },
  containerActive: { borderColor: '#FBBF24' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 14, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  iconBoxActive: { backgroundColor: '#F59E0B' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '900', color: palette.textPrimary },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#FFE4E6' },
  streakText: { fontSize: 9, fontWeight: '900', color: '#E11D48' },
  subtitle: { fontSize: 11, color: palette.textSecondary, marginTop: 2 },
  calendarLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  calendarLinkText: { fontSize: 11, fontWeight: '800', color: '#7C3AED' },
  track: { flexDirection: 'row', gap: 6 },
  dayCell: { flex: 1, minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  dayCellClaimed: { opacity: 0.5 },
  dayCellCurrent: { borderColor: '#F59E0B', borderWidth: 2, backgroundColor: '#FFFBEB' },
  dayLabel: { fontSize: 9, fontWeight: '700', color: palette.textMuted },
  dayCoins: { fontSize: 9, fontWeight: '900', color: palette.textPrimary },
  doneCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  claimBar: { flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  claimBarText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
});
