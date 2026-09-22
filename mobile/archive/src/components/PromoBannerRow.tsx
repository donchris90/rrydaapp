import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { colors, radii, spacing, type } from '../theme';

// The reference app's "Honor / Activity Center" banner row, sitting
// directly under Home's tab row. Both tiles link to real screens/flows
// (HonorRankingScreen, GameCenterScreen) — no "Activity Center" here,
// since there's no events/quests system in this backend to point it at;
// Game Center is the real feature that belongs in its place.
export function PromoBannerRow({ onHonorPress, onGamesPress }: { onHonorPress: () => void; onGamesPress: () => void }) {
  return (
    <View style={styles.row}>
      <PressableScale style={styles.tileWrap} onPress={onHonorPress}>
        <LinearGradient colors={['#FFDD8A', colors.goldDeep]} style={styles.tile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="trophy" size={22} color={colors.textOnLight} />
          <Text style={styles.tileText}>Honor</Text>
        </LinearGradient>
      </PressableScale>
      <PressableScale style={styles.tileWrap} onPress={onGamesPress}>
        <LinearGradient colors={[colors.primary, colors.pink]} style={styles.tile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="game-controller" size={22} color={colors.textPrimary} />
          <Text style={[styles.tileText, { color: colors.textPrimary }]}>Game Center</Text>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  tileWrap: { flex: 1 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tileText: { ...type.bodyStrong, color: colors.textOnLight },
});
