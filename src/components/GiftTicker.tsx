import React, { useEffect, useMemo, useRef } from 'react';
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
//
// Combo count is computed from the real trailing events in the stream —
// consecutive events with the same senderId+giftId count as one combo,
// same as every other "gift streak" UI. Not a separate counter someone
// could desync from what actually happened; it's read directly off the
// real event history each time a new one arrives.
export function GiftTicker({ events }: { events: GiftEvent[] }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const event = events[events.length - 1];

  const comboCount = useMemo(() => {
    if (!event) return 1;
    let count = 0;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.senderId === event.senderId && e.giftId === event.giftId) count++;
      else break;
    }
    return count;
  }, [events, event]);

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
          Someone sent a gift · {event.coinAmount} coins{comboCount > 1 ? ` · x${comboCount}` : ''}
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
