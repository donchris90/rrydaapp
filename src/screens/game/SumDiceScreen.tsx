import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../../theme';

/**
 * SumDiceScreen (Lucky Number / Sum 0-27)
 *
 * NOTE: the previous version of this screen rendered the web (Vite/DOM)
 * prototype of this game directly, which does not run on React Native and
 * would have crashed on open. That web version now lives in
 * /web-prototype/src/components/dice/SumDiceGame.tsx as a reference for
 * building the real React Native version of this screen (see CrashScreen
 * .native.tsx for how the Crash game was ported, as a pattern to follow).
 */
export function SumDiceScreen({
  balance = 5000,
  onUpdateBalance = () => {},
}: {
  balance?: number;
  onUpdateBalance?: (b: number) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sum Dice</Text>
      <Text style={styles.subtitle}>This game's native screen hasn't been built yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...type.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SumDiceScreen;
