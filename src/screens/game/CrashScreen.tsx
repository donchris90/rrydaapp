import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type } from '../../theme';

// Web fallback. The real Crash game is CrashScreen.native.tsx, which Metro
// picks on iOS/Android and which talks to the real, server-authoritative
// game backend. This file used to re-export a self-contained browser
// simulation (src/App.tsx) that ran its own fake rounds client-side —
// nothing in it was real, so it has been archived rather than kept as a
// second implementation of the game. Keeping this file (instead of deleting
// it) means the navigator's import of this screen still resolves on web and
// in `tsc`, which does not know about the .native suffix.
export function CrashScreen() {
  return (
    <View style={styles.root}>
      <Ionicons name="phone-portrait-outline" size={40} color={colors.textMuted} />
      <Text style={styles.title}>Crash is available in the mobile app</Text>
      <Text style={styles.body}>Open Rryda on iOS or Android to play.</Text>
    </View>
  );
}

export default CrashScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.bgDeepest,
  },
  title: { ...type.h2, color: colors.textPrimary, textAlign: 'center' },
  body: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
});
