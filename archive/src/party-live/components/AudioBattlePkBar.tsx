import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, spacing, type } from '../theme';

interface AudioBattlePkBarProps {
  redScore: number;
  blueScore: number;
  timeLeft: number; // in seconds
  redMvpAvatar?: string;
  blueMvpAvatar?: string;
  onPressDetails?: () => void;
}

export function AudioBattlePkBar({
  redScore,
  blueScore,
  timeLeft,
  redMvpAvatar,
  blueMvpAvatar,
  onPressDetails,
}: AudioBattlePkBarProps) {
  const total = redScore + blueScore || 1;
  const redPercent = Math.min(Math.max((redScore / total) * 100, 15), 85);
  const animatedRedWidth = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(animatedRedWidth, {
      toValue: redPercent,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [redPercent, animatedRedWidth]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Pressable onPress={onPressDetails} style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        {/* Red Team Info */}
        <View style={styles.teamBadgeRow}>
          <View style={[styles.teamIndicator, { backgroundColor: '#FF416C' }]} />
          <Text style={styles.teamLabelRed}>Red Team</Text>
          <Text style={styles.scoreTextRed}>{redScore.toLocaleString()}</Text>
        </View>

        {/* Timer & VS Pill */}
        <View style={styles.timerPill}>
          <Ionicons name="flame" size={12} color="#FFD166" />
          <Text style={styles.timerText}>{timeString}</Text>
        </View>

        {/* Blue Team Info */}
        <View style={[styles.teamBadgeRow, { justifyContent: 'flex-end' }]}>
          <Text style={styles.scoreTextBlue}>{blueScore.toLocaleString()}</Text>
          <Text style={styles.teamLabelBlue}>Blue Team</Text>
          <View style={[styles.teamIndicator, { backgroundColor: '#00C9FF' }]} />
        </View>
      </View>

      {/* Tug of War Bar */}
      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.redBar,
            {
              width: animatedRedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={gradients.pkRed}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.blueBar}>
          <LinearGradient
            colors={gradients.pkBlue}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Center VS Crest */}
        <View style={styles.vsCrest}>
          <Text style={styles.vsText}>VS</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(20, 12, 40, 0.85)',
    borderRadius: radii.md,
    padding: spacing.xs * 1.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  teamIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  teamLabelRed: {
    color: '#FF6B8B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scoreTextRed: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  teamLabelBlue: {
    color: '#4DD4F8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scoreTextBlue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
  },
  timerText: {
    color: '#FFD166',
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  barContainer: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0E081F',
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  redBar: {
    height: '100%',
  },
  blueBar: {
    flex: 1,
    height: '100%',
  },
  vsCrest: {
    position: 'absolute',
    top: -1,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFE270',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  vsText: {
    color: '#3B2400',
    fontSize: 8,
    fontWeight: '900',
  },
});
