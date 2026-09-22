import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { colors, gradients, glow, radii, spacing, type } from '../theme';

// The one bold gradient CTA style, reused everywhere (login, register,
// bet button, create-room) instead of each screen styling its own
// purple button — this is "spend your boldness in one place."
export function GradientButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'hero',
  style,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'hero' | 'gold';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const isDisabled = disabled || loading;
  return (
    <PressableScale onPress={onPress} disabled={isDisabled} style={[styles.wrap, isDisabled && glowNone, !isDisabled && (variant === 'gold' ? glow.gold : glow.primary), style]}>
      <LinearGradient
        colors={variant === 'gold' ? gradients.gold : gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'gold' ? colors.textOnLight : colors.textPrimary} />
        ) : (
          <Text style={[styles.text, variant === 'gold' && { color: colors.textOnLight }, textStyle]}>{label}</Text>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

const glowNone = { shadowOpacity: 0, elevation: 0 };

const styles = StyleSheet.create({
  wrap: { borderRadius: radii.md, overflow: 'hidden' },
  gradient: { paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md },
  text: { color: colors.textPrimary, ...type.bodyStrong, fontSize: 16 },
});
