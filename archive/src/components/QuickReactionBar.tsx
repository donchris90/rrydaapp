import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Animated, View, Text } from 'react-native';

const DEFAULT_EMOJIS = ['🔥', '😂', '😍', '👏', '😮', '💯', '❤️', '🎉'] as const;

interface FloatingReaction {
  id: number;
  emoji: string;
  xPercent: number; // 0–100, matches the tap-origin column so the emoji
  // rises roughly from the button that spawned it rather than a fixed
  // spot — same idea as Rryda's xPositionPercent field, just derived
  // from the real button layout instead of a random value.
}

let reactionIdCounter = 0;

// Purely local and ephemeral, same as FloatingHeartsOverlay's double-tap
// hearts — no backend field for reaction counts or reaction history
// exists anywhere in this app, so this never claims to persist, sync to
// other viewers, or count toward anything real. It's a same-device
// expressive touch, not a broadcast reaction.
export function QuickReactionBar({
  emojis = DEFAULT_EMOJIS,
  orientation = 'horizontal',
}: {
  emojis?: readonly string[];
  orientation?: 'horizontal' | 'vertical';
}) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const spawn = (emoji: string, xPercent: number) => {
    const id = reactionIdCounter++;
    setReactions((current) => [...current.slice(-11), { id, emoji, xPercent }]);
    setTimeout(() => setReactions((current) => current.filter((r) => r.id !== id)), 1800);
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {reactions.map((r) => (
          <RisingReaction key={r.id} emoji={r.emoji} xPercent={r.xPercent} />
        ))}
      </View>

      <View style={[styles.bar, orientation === 'vertical' && styles.barVertical]}>
        {emojis.map((emoji, index) => (
          <Pressable
            key={emoji}
            style={styles.button}
            onPress={() => spawn(emoji, (index / Math.max(1, emojis.length - 1)) * 100)}
          >
            <Text style={styles.buttonEmoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RisingReaction({ emoji, xPercent }: { emoji: string; xPercent: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  React.useEffect(() => {
    const drift = (Math.random() - 0.5) * 40;
    Animated.parallel([
      Animated.timing(translateY, { toValue: -260, duration: 1800, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: drift, duration: 1800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(opacity, { toValue: 0, duration: 1800, delay: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.reaction,
        {
          left: `${xPercent}%`,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      <Text style={styles.reactionEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 12, bottom: 90 },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    padding: 4,
    gap: 2,
  },
  barVertical: { flexDirection: 'column' },
  button: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  buttonEmoji: { fontSize: 18 },
  reaction: { position: 'absolute', bottom: 40 },
  reactionEmoji: { fontSize: 24 },
});
