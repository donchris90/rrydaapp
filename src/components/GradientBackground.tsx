import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { gradients } from '../theme';

export function GradientBackground({ children, style, variant = 'default' }: { children?: React.ReactNode; style?: ViewStyle; variant?: 'default' | 'pink' }) {
  const { isMidnight } = useTheme();
  const screenGradient = isMidnight ? gradients.screenMidnight : gradients.screen;
  return (
    <View style={[styles.fill, style]}>
      <LinearGradient colors={screenGradient} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={variant === 'pink' ? gradients.glowPink : gradients.glow} style={styles.blobTopRight} pointerEvents="none" />
      <LinearGradient colors={gradients.glowPink} style={styles.blobBottomLeft} pointerEvents="none" />
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  blobTopRight: { position: 'absolute', top: -120, right: -100, width: 280, height: 280, borderRadius: 140 },
  blobBottomLeft: { position: 'absolute', bottom: -140, left: -120, width: 300, height: 300, borderRadius: 150, opacity: 0.6 },
});
