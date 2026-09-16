import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii } from '../theme';

// A shimmering placeholder block instead of a bare spinner — used for
// list rows/cards while their query is loading. One looping sweep
// per mounted skeleton; stops cleanly on unmount.
export function Skeleton({ style }: { style?: ViewStyle }) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-180, 180] });

  return (
    <View style={[styles.base, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient colors={gradients.shimmer} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton style={styles.avatar} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton style={styles.line} />
        <Skeleton style={styles.lineShort} />
      </View>
    </View>
  );
}

// Grid-card shaped placeholder, matching ExploreCard's proportions, for
// the Explore grid's loading state.
export function SkeletonCard() {
  return <Skeleton style={styles.card} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface, borderRadius: radii.sm, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  line: { height: 14, width: '60%', borderRadius: 6 },
  lineShort: { height: 12, width: '35%', borderRadius: 6 },
  card: { flex: 1, aspectRatio: 0.78, borderRadius: radii.lg },
});
