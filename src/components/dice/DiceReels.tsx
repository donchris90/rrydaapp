import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from './luckyNumberTheme';
import type { DiceRoundStatus } from './luckyNumberTypes';

interface DiceReelsProps {
  status: DiceRoundStatus;
  dice: [number, number, number];
  targetSum?: number | null;
}

export function DiceReels({ status, dice }: DiceReelsProps) {
  const sum = dice[0] + dice[1] + dice[2];
  const isRolling = status === 'ROLLING';
  const isSettled = status === 'SETTLED';

  // Pulse animation for the glowing container
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Shake / bounce for settling
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRolling) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRolling, pulseAnim]);

  useEffect(() => {
    if (isSettled) {
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      bounceAnim.setValue(0);
    }
  }, [isSettled, bounceAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.reelsOuterFrame,
          isRolling && styles.reelsOuterFrameRolling,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={styles.reelsInnerCard}>
          {/* Digit Slot 1 */}
          <View style={styles.digitSlot}>
            <Text
              style={[
                styles.digitText,
                isRolling && styles.digitTextRolling,
              ]}
            >
              {isRolling ? '?' : dice[0]}
            </Text>
          </View>

          {/* Vertical Divider 1 */}
          <View style={styles.verticalDivider} />

          {/* Digit Slot 2 */}
          <View style={styles.digitSlot}>
            <Text
              style={[
                styles.digitText,
                isRolling && styles.digitTextRolling,
              ]}
            >
              {isRolling ? '?' : dice[1]}
            </Text>
          </View>

          {/* Vertical Divider 2 */}
          <View style={styles.verticalDivider} />

          {/* Digit Slot 3 */}
          <View style={styles.digitSlot}>
            <Text
              style={[
                styles.digitText,
                isRolling && styles.digitTextRolling,
              ]}
            >
              {isRolling ? '?' : dice[2]}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Outcome Banner when settled */}
      {isSettled && (
        <Animated.View
          style={[
            styles.outcomeBanner,
            {
              transform: [
                {
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
              opacity: bounceAnim,
            },
          ]}
        >
          <Text style={styles.outcomeSumText}>
            Sum = {sum}
          </Text>
          <View style={styles.outcomePillRow}>
            <View
              style={[
                styles.outcomePill,
                sum <= 13 ? styles.pillSmall : styles.pillBig,
              ]}
            >
              <Text style={styles.outcomePillText}>
                {sum <= 13 ? 'Small (0-13)' : 'Big (14-27)'}
              </Text>
            </View>
            <View
              style={[
                styles.outcomePill,
                sum % 2 === 0 ? styles.pillEven : styles.pillOdd,
              ]}
            >
              <Text style={styles.outcomePillText}>
                {sum % 2 === 0 ? 'Even' : 'Odd'}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  reelsOuterFrame: {
    width: '82%',
    maxWidth: 320,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 22,
    padding: 5,
    borderWidth: 2.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  reelsOuterFrameRolling: {
    borderColor: '#FACC15',
    shadowColor: '#FACC15',
  },
  reelsInnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    height: 64,
  },
  digitSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 2.5,
    height: 32,
    backgroundColor: '#BAE6FD',
    borderRadius: 1.5,
  },
  digitText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1E1B4B',
    fontFamily: 'monospace',
  },
  digitTextRolling: {
    color: '#0284C7',
  },
  outcomeBanner: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  outcomeSumText: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: '800',
  },
  outcomePillRow: {
    flexDirection: 'row',
    gap: 5,
  },
  outcomePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pillSmall: {
    backgroundColor: '#3B82F6',
  },
  pillBig: {
    backgroundColor: '#EC4899',
  },
  pillEven: {
    backgroundColor: '#8B5CF6',
  },
  pillOdd: {
    backgroundColor: '#F59E0B',
  },
  outcomePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
