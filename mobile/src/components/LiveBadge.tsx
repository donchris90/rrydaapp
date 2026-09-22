import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

// A small breathing dot + "LIVE" label — the one non-user-triggered loop
// in the app, reserved for exactly this signal (something happening
// right now) rather than sprinkled on decorative elements. Also doubles
// as a plain "online" dot (label omitted) for avatars.
export function LiveBadge({ label = 'LIVE', size = 'md' }: { label?: string | null; size?: 'sm' | 'md' }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const dotSize = size === 'sm' ? 6 : 7;

  if (!label) {
    return (
      <View style={[styles.dotWrap, { width: dotSize * 2, height: dotSize * 2 }]}>
        <Animated.View
          style={[styles.dotPing, { width: dotSize * 2, height: dotSize * 2, borderRadius: dotSize, opacity, transform: [{ scale }] }]}
        />
        <View style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
      </View>
    );
  }

  return (
    <View style={styles.badge}>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dotPing, { opacity, transform: [{ scale }] }]} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.live,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  dotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textPrimary },
  dotPing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textPrimary,
  },
  label: { color: colors.textPrimary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
});
