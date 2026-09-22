import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { formatCompactNumber } from '../../utils/formatters';

interface StatsRowProps {
  pkWins: number;
  pkLosses: number;
  followingCount: number;
  followersCount: number;
  visitorsToday?: number;
  onSelectStat?: (statKey: string) => void;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  pkWins,
  pkLosses,
  followingCount,
  followersCount,
  visitorsToday,
  onSelectStat,
}) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const winRate = pkWins + pkLosses > 0 ? Math.round((pkWins / (pkWins + pkLosses)) * 100) : 0;

  const items = [
    { key: 'pkWins', label: 'PK Wins', value: formatCompactNumber(pkWins), sub: `${winRate}% win rate`, icon: 'flash-outline' as const },
    { key: 'following', label: 'Following', value: formatCompactNumber(followingCount), sub: 'Creators', icon: 'checkmark-circle-outline' as const },
    { key: 'followers', label: 'Followers', value: formatCompactNumber(followersCount), sub: 'Fans', icon: 'people-outline' as const },
    // Only shown when the caller has a real number. There is no visitor
    // tracking on the backend yet, so the profile doesn't pass one.
    ...(visitorsToday !== undefined
      ? [{ key: 'visitors', label: 'Visitors', value: formatCompactNumber(visitorsToday), sub: 'Today', icon: 'eye-outline' as const }]
      : []),
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable key={item.key} style={styles.cell} onPress={() => onSelectStat?.(item.key)}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.sub}>{item.sub}</Text>
        </Pressable>
      ))}
    </View>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: palette.card, borderRadius: 20, paddingVertical: 12 },
  cell: { flex: 1, alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '900', color: palette.textPrimary },
  label: { fontSize: 11, fontWeight: '600', color: palette.textSecondary, marginTop: 2 },
  sub: { fontSize: 9, color: palette.textMuted, marginTop: 1 },
});
