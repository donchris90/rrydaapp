import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const ProfileSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Animated.View style={[styles.avatar, { opacity: pulseAnim }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <Animated.View style={[styles.lineLarge, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.lineMedium, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.lineSmall, { opacity: pulseAnim }]} />
          </View>
        </View>
      </View>

      {/* BioCard skeleton */}
      <View style={styles.card}>
        <Animated.View style={[styles.lineMedium, { opacity: pulseAnim, marginBottom: 8 }]} />
        <Animated.View style={[styles.lineFull, { opacity: pulseAnim, marginBottom: 6 }]} />
        <Animated.View style={[styles.lineFull, { opacity: pulseAnim, width: '70%' }]} />
      </View>

      {/* User Badges skeleton */}
      <View style={styles.card}>
        <Animated.View style={[styles.lineSmall, { opacity: pulseAnim, marginBottom: 10 }]} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <Animated.View key={i} style={[styles.badgePlaceholder, { opacity: pulseAnim }]} />
          ))}
        </View>
      </View>

      {/* StatsRow skeleton */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <Animated.View style={[styles.statNumber, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.statLabel, { opacity: pulseAnim }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEDF6',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
  },
  lineLarge: {
    height: 18,
    width: '60%',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  lineMedium: {
    height: 14,
    width: '45%',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  lineSmall: {
    height: 12,
    width: '30%',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  lineFull: {
    height: 12,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  badgePlaceholder: {
    width: 70,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  statNumber: {
    width: 40,
    height: 18,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  statLabel: {
    width: 32,
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
});
