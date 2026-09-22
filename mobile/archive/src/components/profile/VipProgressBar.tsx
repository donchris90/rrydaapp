import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface VipProgressBarProps {
  vipLevel?: number;
  onOpenVipDetails: () => void;
}

const VIP_TIER_NAMES: Record<number, string> = {
  0: 'Standard Member',
  1: 'Bronze Knight',
  2: 'Silver Baron',
  3: 'Golden Lord',
  4: 'Platinum Duke',
  5: 'Diamond Monarch',
  6: 'Supreme Royal',
  7: 'Celestial Emperor',
};

export const VipProgressBar: React.FC<VipProgressBarProps> = ({ vipLevel = 0, onOpenVipDetails }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const currentLevel = vipLevel || 0;
  const currentTitle = VIP_TIER_NAMES[currentLevel] || 'VIP Member';
  const nextLevel = Math.min(7, currentLevel + 1);
  const nextTitle = VIP_TIER_NAMES[nextLevel];
  const progressPercent = currentLevel >= 7 ? 100 : 68;

  return (
    <Pressable onPress={onOpenVipDetails} style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F0F3FA', '#F6F8FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <LinearGradient colors={['#FFDD8A', palette.chipYellow]} style={styles.iconCircle}>
            <Ionicons name="ribbon" size={16} color="#F6F8FC" />
          </LinearGradient>
          <View style={styles.textGroup}>
            <View style={styles.titleRow}>
              <Text style={styles.tierText}>
                VIP {currentLevel} • {currentTitle}
              </Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>
            <Text style={styles.subText}>
              {currentLevel >= 7
                ? 'Maximum VIP Honor achieved!'
                : `Spend 158K more coins to reach VIP ${nextLevel} (${nextTitle})`}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGroup}>
          <Text style={styles.detailsText}>Details</Text>
          <Ionicons name="chevron-forward" size={16} color={palette.chipYellow} />
        </View>
      </View>

      {currentLevel < 7 && (
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>
      )}
    </Pressable>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  iconCircle: { width: 28, height: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  textGroup: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  tierText: { color: palette.chipYellow, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  activePill: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(251,191,36,0.2)' },
  activePillText: { color: '#FCD34D', fontSize: 9, fontWeight: '700' },
  subText: { color: '#CBD5E1', fontSize: 11, marginTop: 3 },
  detailsGroup: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { color: palette.chipYellow, fontSize: 12, fontWeight: '700', marginRight: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  track: { flex: 1, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', padding: 1, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: palette.chipYellow },
  progressText: { fontSize: 10, fontFamily: 'monospace', fontWeight: '700', color: '#FCD34D' },
});
