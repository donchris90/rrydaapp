import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { GiftEvent } from '../live/useLiveChat';

interface Point {
  x: number;
  y: number;
}

interface Flight {
  key: string;
  icon: string;
  label: string;
  combo: number;
  from: Point;
  to: Point;
}

const FLIGHT_MS = 1700;
const COMBO_WINDOW_MS = 3000;
const ICON = 46;

// Every gift that is sent shows for EVERYONE in the live or room: the gift's icon
// pops up near the sender, then flies to the receiver's head and fades there — like
// BIGO — with "Ada · Rose" and a ×N when the same person keeps sending the same
// gift. `resolveTarget` says where the receiver is (their avatar in a live, their
// seat in a party); if it can't tell, the gift flies to the middle of the screen.
export function GiftFlyOverlay({
  events,
  meId,
  resolveTarget,
  bottomInset = 0,
}: {
  events: GiftEvent[];
  meId?: string | null;
  resolveTarget: (event: GiftEvent) => Promise<Point | null> | Point | null;
  bottomInset?: number;
}) {
  const { width, height } = useWindowDimensions();
  const [flights, setFlights] = useState<Flight[]>([]);
  const seen = useRef(new WeakSet<GiftEvent>());
  const combos = useRef(new Map<string, { count: number; at: number }>());
  const counter = useRef(0);
  const resolveRef = useRef(resolveTarget);
  resolveRef.current = resolveTarget;

  useEffect(() => {
    for (const event of events) {
      if (seen.current.has(event)) continue;
      seen.current.add(event);

      const comboKey = `${event.senderId}|${event.giftId}|${event.recipientId}`;
      const now = Date.now();
      const prev = combos.current.get(comboKey);
      const count = prev && now - prev.at < COMBO_WINDOW_MS ? prev.count + 1 : 1;
      combos.current.set(comboKey, { count, at: now });

      // Your own gift leaves from your gift button; other people's from the bottom left.
      const from: Point = event.senderId === meId ? { x: width - 34, y: height - bottomInset - 34 } : { x: 60 + Math.random() * 60, y: height * 0.62 };

      Promise.resolve(resolveRef.current(event))
        .catch(() => null)
        .then((target) => {
          const to = target ?? { x: width / 2, y: height * 0.32 };
          const key = `f${counter.current++}`;
          setFlights((f) => [...f, { key, icon: event.giftIcon || '🎁', label: `${event.senderName ?? 'Someone'} · ${event.giftName ?? 'Gift'}`, combo: count, from, to }]);
        });
    }
  }, [events, meId, width, height, bottomInset]);

  const done = (key: string) => setFlights((f) => f.filter((x) => x.key !== key));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {flights.map((f) => (
        <FlyingGift key={f.key} flight={f} onDone={() => done(f.key)} />
      ))}
    </View>
  );
}

function FlyingGift({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(p, { toValue: 1, duration: FLIGHT_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => onDone());
  }, [p, onDone]);

  const { from, to } = flight;
  const midX = from.x + (to.x - from.x) * 0.5;
  // a gentle arc: it rises before it drops onto the receiver
  const midY = Math.min(from.y, to.y) - 60;

  const x = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [from.x - ICON / 2, midX - ICON / 2, to.x - ICON / 2] });
  const y = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [from.y - ICON / 2, midY - ICON / 2, to.y - ICON / 2] });
  const scale = p.interpolate({ inputRange: [0, 0.12, 0.55, 1], outputRange: [0.4, 1.5, 1.15, 0.45] });
  const opacity = p.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
  const labelOpacity = p.interpolate({ inputRange: [0, 0.1, 0.55, 0.7], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View style={[styles.flight, { opacity, transform: [{ translateX: x }, { translateY: y }, { scale }] }]}>
      <Text style={styles.icon}>{flight.icon}</Text>
      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]}>
        <Text style={styles.label} numberOfLines={1}>
          {flight.label}
          {flight.combo > 1 ? `  ×${flight.combo}` : ''}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flight: { position: 'absolute', left: 0, top: 0, width: ICON, height: ICON, alignItems: 'center' },
  icon: { fontSize: ICON - 6, textAlign: 'center' },
  labelWrap: { position: 'absolute', top: ICON, width: 180, alignItems: 'center', left: -(180 - ICON) / 2 },
  label: { color: '#FFF', fontSize: 11, fontWeight: '900', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
});
