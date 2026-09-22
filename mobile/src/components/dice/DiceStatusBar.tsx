import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from './luckyNumberTheme';
import type { DiceRoundStatus } from './luckyNumberTypes';

interface DiceStatusBarProps {
  balance: number;
  countdownSeconds: number;
  roundStatus: DiceRoundStatus;
  activePlayers?: number;
  onOpenLeaderboard?: () => void;
  onOpenHelp?: () => void;
}

export function DiceStatusBar({
  balance,
  countdownSeconds,
  roundStatus,
  activePlayers = 108,
  onOpenLeaderboard,
  onOpenHelp,
}: DiceStatusBarProps) {
  const isUrgent = countdownSeconds <= 5 && roundStatus === 'OPEN';

  return (
    <View style={styles.container}>
      {/* Left Trophy Button */}
      <Pressable
        onPress={onOpenLeaderboard}
        style={({ pressed }) => [
          styles.trophyButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.trophyIcon}>🏆</Text>
      </Pressable>

      {/* Main Indigo Pill Container */}
      <View style={styles.indigoBar}>
        {/* Active Players / Tickets Badge */}
        <View style={styles.ticketBadge}>
          <Text style={styles.ticketIcon}>🎟️</Text>
          <Text style={styles.ticketCount}>{activePlayers}</Text>
        </View>

        {/* Coin Balance Badge */}
        <View style={styles.balanceBadge}>
          <View style={styles.coinIconWrapper}>
            <Text style={styles.coinEmoji}>🪙</Text>
          </View>
          <Text style={styles.balanceText}>
            {balance.toLocaleString()}
          </Text>
        </View>

        {/* Countdown Timer Badge */}
        <View
          style={[
            styles.timerBadge,
            isUrgent && styles.timerBadgeUrgent,
            roundStatus === 'ROLLING' && styles.timerBadgeRolling,
          ]}
        >
          <Text style={styles.timerText}>
            {roundStatus === 'ROLLING'
              ? 'Roll'
              : roundStatus === 'SETTLED'
              ? 'Done'
              : `${countdownSeconds}s`}
          </Text>
        </View>
      </View>

      {/* Right Help Button */}
      <Pressable
        onPress={onOpenHelp}
        style={({ pressed }) => [
          styles.helpButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.helpText}>?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginVertical: 4,
    gap: 8,
  },
  trophyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FEF08A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  trophyIcon: {
    fontSize: 16,
  },
  indigoBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E2563',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 12,
  },
  ticketIcon: {
    fontSize: 12,
  },
  ticketCount: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  coinIconWrapper: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinEmoji: {
    fontSize: 14,
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  timerBadge: {
    backgroundColor: '#F87171',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  timerBadgeUrgent: {
    backgroundColor: '#EF4444',
  },
  timerBadgeRolling: {
    backgroundColor: '#A855F7',
    borderColor: '#C084FC',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FEF08A',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  helpText: {
    color: '#713F12',
    fontSize: 18,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
