import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export interface DailyReward {
  day: number;
  coins: number;
  points?: number;
  specialItem?: string;
  isClaimed: boolean;
  isCurrent: boolean;
}

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: DailyReward[];
  streak: number;
  onClaim: (day: number) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose, rewards, streak, onClaim }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const safeRewards = Array.isArray(rewards) ? rewards : [];
  const currentReward = safeRewards.find((r) => r.isCurrent);

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="gift" size={18} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>Daily Check-in</Text>
                  <View style={styles.streakPill}>
                    <Ionicons name="flame" size={11} color="#E11D48" />
                    <Text style={styles.streakText}>{streak} Days</Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>Check in daily to build your streak</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.grid}>
              {safeRewards.map((reward) => {
                const isDay7 = reward.day === 7;
                return (
                  <View
                    key={reward.day}
                    style={[
                      styles.dayCell,
                      isDay7 && styles.dayCellWide,
                      reward.isClaimed && styles.dayCellClaimed,
                      reward.isCurrent && styles.dayCellCurrent,
                    ]}
                  >
                    <Text style={styles.dayLabel}>Day {reward.day}</Text>
                    <Text style={styles.dayCoins}>+{reward.coins}</Text>
                    {reward.isClaimed ? (
                      <View style={styles.doneCircle}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    ) : reward.isCurrent ? (
                      <Pressable style={styles.claimChip} onPress={() => onClaim(reward.day)}>
                        <Text style={styles.claimChipText}>Claim</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.lockedText}>Locked</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {currentReward && !currentReward.isClaimed && (
              <Pressable style={styles.primaryButton} onPress={() => onClaim(currentReward.day)}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Claim Day {currentReward.day} (+{currentReward.coins} Coins)</Text>
              </Pressable>
            )}

            <View style={styles.rulesBox}>
              <View style={styles.rulesTitleRow}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.rulesTitle}>Streak Rules</Text>
              </View>
              <Text style={styles.rulesText}>• Check in every day to keep your streak going; missing a day starts it over.</Text>
              <Text style={styles.rulesText}>• The reward grows each day up to day 7, then stays at the day-7 amount.</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  headerIcon: { width: 36, height: 36, borderRadius: 14, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: palette.textPrimary },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#FFE4E6' },
  streakText: { fontSize: 9, fontWeight: '900', color: '#E11D48' },
  headerSubtitle: { fontSize: 11, color: palette.textSecondary, marginTop: 2 },
  body: { padding: 20, gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCell: { width: '22%', minHeight: 88, padding: 8, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'space-between' },
  dayCellWide: { width: '47%' },
  dayCellClaimed: { opacity: 0.55 },
  dayCellCurrent: { borderColor: '#F59E0B', borderWidth: 2, backgroundColor: '#FFFBEB' },
  dayLabel: { fontSize: 9, fontWeight: '800', color: palette.textMuted },
  dayCoins: { fontSize: 12, fontWeight: '900', color: palette.textPrimary },
  doneCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  claimChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F59E0B' },
  claimChipText: { fontSize: 9, fontWeight: '900', color: '#0F172A' },
  lockedText: { fontSize: 9, color: palette.textMuted },
  primaryButton: { flexDirection: 'row', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  rulesBox: { padding: 14, borderRadius: 16, backgroundColor: palette.background, gap: 4 },
  rulesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  rulesTitle: { fontSize: 12, fontWeight: '800', color: palette.textPrimary },
  rulesText: { fontSize: 11, color: palette.textSecondary, lineHeight: 16 },
});
