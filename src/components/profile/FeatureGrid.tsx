import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface FeatureGridProps {
  onOpenReward: () => void;
  onOpenRank: () => void;
  onOpenStore: () => void;
  onOpenInvite: () => void;
  onOpenGames: () => void;
  onOpenVideos: () => void;
}

// Only entries that lead somewhere real. Guardian, Privileges and Fan Club
// used to be here, each opening a "not implemented" alert, and several tiles
// carried invented badges ("Ready", "Hot").
export const FeatureGrid: React.FC<FeatureGridProps> = ({
  onOpenReward,
  onOpenRank,
  onOpenStore,
  onOpenInvite,
  onOpenGames,
  onOpenVideos,
}) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const items: { label: string; icon: string; color: string; onPress: () => void }[] = [
    { label: 'Reward', icon: 'gift-outline', color: palette.chipRed, onPress: onOpenReward },
    { label: 'Rank', icon: 'trophy-outline', color: palette.chipOrange, onPress: onOpenRank },
    { label: 'Buy coins', icon: 'bag-handle-outline', color: palette.chipTeal, onPress: onOpenStore },
    { label: 'Invite', icon: 'mail-unread-outline', color: palette.chipRed, onPress: onOpenInvite },
    { label: 'Games', icon: 'game-controller-outline', color: palette.chipBlue, onPress: onOpenGames },
    { label: 'Videos', icon: 'play-circle-outline', color: palette.chipPurple, onPress: onOpenVideos },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <Pressable key={index} onPress={item.onPress} style={styles.item}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={22} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEDF6',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  item: {
    width: '25%',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: '#E11D48',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#221F33',
    marginTop: 6,
    textAlign: 'center',
  },
});
