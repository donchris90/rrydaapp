import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { GiftEvent } from '../live/useLiveChat';
import { colors, spacing, radii, type } from '../theme';

// Real gift:sent events — only possible now that GiftController actually
// broadcasts them (see economy.controller.ts's comment; this event never
// fired at all before that fix). Shows only the most recent one at a
// time with a brief fade, rather than a permanent scrolling list —
// matches the reference app's transient announcement style more than a
// persistent log would.
export function GiftTicker({ event }: { event: GiftEvent | undefined }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!event) return;
    opacity.setValue(1);
    const timeout = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [event, opacity]);

  if (!event) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity }]}>
      <LinearGradient colors={[colors.gold, colors.goldDeep]} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.text} numberOfLines={1}>
          Someone sent a gift · {event.coinAmount} coins
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, marginTop: spacing.xs },
  banner: { borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  text: { ...type.caption, color: colors.textOnLight, fontWeight: '800' },
});
