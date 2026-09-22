import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';

interface DiceStreakBadgeProps {
  streak: number;
  bestStreak?: number;
  isGlowing?: boolean;
  onPress?: () => void;
}

export function DiceStreakBadge({
  streak,
  bestStreak = 0,
  isGlowing = false,
  onPress,
}: DiceStreakBadgeProps) {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const prevStreakRef = useRef(streak);

  // Trigger celebration glow when streak increases or isGlowing becomes true
  useEffect(() => {
    const hasIncreased = streak > prevStreakRef.current && streak > 0;
    prevStreakRef.current = streak;

    if (isGlowing || hasIncreased) {
      // 1. Pop scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.28,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: false,
        }),
      ]).start();

      // 2. Pulsing celebratory glow aura
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start();

      // 3. Sparkle particles animation
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.delay(1200),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [streak, isGlowing, scaleAnim, glowAnim, sparkleAnim]);

  // Interpolated glow opacity and border colors
  const glowBorderColor = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(245, 158, 11, 0.3)', 'rgba(251, 191, 36, 0.9)', 'rgba(255, 230, 0, 1)'],
  });

  const auraOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  const auraScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  // Determine badge styling tier
  const isHighStreak = streak >= 5;
  const isHotStreak = streak >= 2;
  const hasStreak = streak > 0;

  return (
    <View style={styles.outerWrapper}>
      {/* Outer celebratory radiant glow aura (visible when glowing) */}
      <Animated.View
        style={[
          styles.glowAura,
          {
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
            backgroundColor: isHighStreak ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)',
          },
        ]}
      />

      {/* Floating Sparkle Particles */}
      <Animated.View style={[styles.sparkleLeft, { opacity: sparkleAnim }]}>
        <Text style={styles.sparkleText}>✨</Text>
      </Animated.View>
      <Animated.View style={[styles.sparkleRight, { opacity: sparkleAnim }]}>
        <Text style={styles.sparkleText}>⭐</Text>
      </Animated.View>
      <Animated.View style={[styles.sparkleTop, { opacity: sparkleAnim }]}>
        <Text style={styles.sparkleText}>🎉</Text>
      </Animated.View>

      {/* Main Interactive Badge */}
      <Animated.View
        style={[
          styles.badgeContainer,
          hasStreak && styles.badgeContainerActive,
          isHotStreak && styles.badgeContainerHot,
          isHighStreak && styles.badgeContainerHigh,
          {
            borderColor: glowBorderColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.pressableContent,
            pressed && styles.pressedState,
          ]}
        >
          {/* Flame Icon with intensity */}
          <Text style={styles.flameIcon}>
            {isHighStreak ? '🔥🔥' : hasStreak ? '🔥' : '⚡'}
          </Text>

          {/* Streak Count and Title */}
          <View style={styles.labelWrapper}>
            <Text
              style={[
                styles.streakCountText,
                hasStreak ? styles.streakCountActive : styles.streakCountMuted,
              ]}
            >
              {streak}
            </Text>
            <Text
              style={[
                styles.streakLabelText,
                hasStreak ? styles.streakLabelActive : styles.streakLabelMuted,
              ]}
            >
              {isHighStreak
                ? 'MEGA STREAK!'
                : hasStreak
                ? streak === 1
                  ? 'WIN STREAK'
                  : 'WIN STREAK'
                : 'WIN STREAK'}
            </Text>
          </View>

          {/* Best Streak Sub-badge */}
          {bestStreak > 0 && (
            <View style={styles.bestPill}>
              <Text style={styles.bestText}>BEST {bestStreak}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
    position: 'relative',
    zIndex: 15,
  },
  glowAura: {
    position: 'absolute',
    width: 170,
    height: 38,
    borderRadius: 20,
    filter: 'blur(8px)',
  } as any,
  sparkleLeft: {
    position: 'absolute',
    left: '20%',
    top: -12,
    zIndex: 20,
  },
  sparkleRight: {
    position: 'absolute',
    right: '20%',
    top: -12,
    zIndex: 20,
  },
  sparkleTop: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    zIndex: 20,
  },
  sparkleText: {
    fontSize: 14,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 74, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeContainerActive: {
    backgroundColor: 'rgba(28, 25, 77, 0.95)',
    borderColor: 'rgba(245, 158, 11, 0.6)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  badgeContainerHot: {
    backgroundColor: 'rgba(45, 26, 75, 0.95)',
    borderColor: 'rgba(251, 191, 36, 0.8)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  badgeContainerHigh: {
    backgroundColor: 'rgba(60, 18, 50, 0.95)',
    borderColor: 'rgba(244, 63, 94, 0.9)',
    shadowColor: '#F43F5E',
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  pressableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressedState: {
    opacity: 0.8,
  },
  flameIcon: {
    fontSize: 14,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakCountText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  streakCountActive: {
    color: '#FDE047',
    textShadowColor: 'rgba(245, 158, 11, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  streakCountMuted: {
    color: '#94A3B8',
  },
  streakLabelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  streakLabelActive: {
    color: '#FBBF24',
  },
  streakLabelMuted: {
    color: '#64748B',
  },
  bestPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bestText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.4,
  },
});
