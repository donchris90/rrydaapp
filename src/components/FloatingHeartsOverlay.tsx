import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
}

const HEART_COLORS = [colors.pink, colors.primary, colors.gold, '#FF6B9D'];
let heartIdCounter = 0;

// Purely a local, decorative double-tap gesture — no backend field for a
// "like count" exists anywhere in this app (checked the schema before
// building this), so this never claims to persist or count anything. It
// wraps its children (the video) and detects two taps within 300ms,
// same threshold most apps use for this gesture.
export function FloatingHeartsOverlay({ children }: { children: React.ReactNode }) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const lastTapRef = useRef(0);

  const spawnHeart = (x: number) => {
    const id = heartIdCounter++;
    const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    setHearts((current) => [...current, { id, x, color }]);
    setTimeout(() => setHearts((current) => current.filter((h) => h.id !== id)), 1500);
  };

  const handleTap = (event: { nativeEvent: { locationX: number } }) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      spawnHeart(event.nativeEvent.locationX);
    }
    lastTapRef.current = now;
  };

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
      {children}
      {hearts.map((heart) => (
        <RisingHeart key={heart.id} x={heart.x} color={heart.color} />
      ))}
    </Pressable>
  );
}

function RisingHeart({ x, color }: { x: number; color: string }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    const drift = (Math.random() - 0.5) * 60;
    Animated.parallel([
      Animated.timing(translateY, { toValue: -220, duration: 1500, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: drift, duration: 1500, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, friction: 3 }),
        Animated.timing(scale, { toValue: 0.9, duration: 1100, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 1500, delay: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heart,
        {
          left: x - 12,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      <Ionicons name="heart" size={26} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heart: { position: 'absolute', bottom: 140 },
});
