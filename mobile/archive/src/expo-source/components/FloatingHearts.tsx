import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeartItem {
  id: number;
  color: string;
  size: number;
  startX: number;
}

const HEART_COLORS = ['#FF2A6D', '#FF5E7E', '#FFB703', '#8338EC', '#3A86FF', '#05FFA1'];

export interface FloatingHeartsHandle {
  spawnHeart: () => void;
}

export const FloatingHearts = React.forwardRef<FloatingHeartsHandle, { count?: number }>((props, ref) => {
  const [hearts, setHearts] = useState<HeartItem[]>([]);
  const nextId = useRef(0);

  const spawnHeart = () => {
    const id = nextId.current++;
    const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    const size = 20 + Math.floor(Math.random() * 14);
    const startX = Math.random() * 36 - 18; // offset +/- 18px

    setHearts((prev) => [...prev.slice(-24), { id, color, size, startX }]);
  };

  React.useImperativeHandle(ref, () => ({
    spawnHeart,
  }));

  const removeHeart = (id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <View pointerEvents="none" style={styles.container}>
      {hearts.map((heart) => (
        <SingleHeart key={heart.id} heart={heart} onComplete={() => removeHeart(heart.id)} />
      ))}
    </View>
  );
});

function SingleHeart({ heart, onComplete }: { heart: HeartItem; onComplete: () => void }) {
  const animY = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;
  const animScale = useRef(new Animated.Value(0.4)).current;
  const animWobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animY, {
        toValue: -280 - Math.random() * 60,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(animScale, {
          toValue: 1.15,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(animScale, {
          toValue: 0.9,
          duration: 1550,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(animWobble, {
            toValue: 12,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(animWobble, {
            toValue: -12,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.heartWrap,
        {
          left: 20 + heart.startX,
          opacity: animOpacity,
          transform: [
            { translateY: animY },
            { translateX: animWobble },
            { scale: animScale },
          ],
        },
      ]}
    >
      <Ionicons name="heart" size={heart.size} color={heart.color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 80,
    height: 350,
    overflow: 'visible',
    zIndex: 99,
  },
  heartWrap: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
