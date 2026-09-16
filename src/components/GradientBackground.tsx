import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../theme';

// The backdrop every screen sits on — a deep-to-elevated purple sweep
// (not a flat fill) with two soft off-screen glow blobs, the same trick
// the reference apps use behind their room/profile screens to keep a
// dark UI from feeling flat. Purely decorative: `pointerEvents="none"` on
// the blobs so they never intercept touches meant for real content.
export function GradientBackground({
  children,
  style,
  variant = 'default',
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'pink';
}) {
  return (
    <View style={[styles.fill, style]}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={variant === 'pink' ? gradients.glowPink : gradients.glow}
        style={styles.blobTopRight}
        pointerEvents="none"
      />
      <LinearGradient colors={gradients.glowPink} style={styles.blobBottomLeft} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  blobTopRight: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.6,
  },
});
