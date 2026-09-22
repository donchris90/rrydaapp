import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { colors } from './luckyNumberTheme';
import type { NumberBetMap } from './luckyNumberTypes';

interface DiceBoardProps {
  bets: NumberBetMap;
  winningNumber: number | null;
  isSettled: boolean;
  onToggleNumberBet: (num: number) => void;
  disabled?: boolean;
}

export function DiceBoard({
  bets,
  winningNumber,
  isSettled,
  onToggleNumberBet,
  disabled = false,
}: DiceBoardProps) {
  // 4 rows of 7 columns = 28 numbers (0 to 27)
  const rows = [
    [0, 1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
  ];

  return (
    <View style={styles.boardContainer}>
      {rows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={styles.gridRow}>
          {row.map((num) => {
            const betAmount = bets[num] || 0;
            const hasBet = betAmount > 0;
            const isWinner = isSettled && winningNumber === num;

            return (
              <Pressable
                key={`num-${num}`}
                disabled={disabled}
                onPress={() => onToggleNumberBet(num)}
                style={({ pressed }) => [
                  styles.card,
                  hasBet ? styles.cardSelected : styles.cardUnselected,
                  isWinner && styles.cardWinner,
                  pressed && styles.cardPressed,
                  disabled && styles.cardDisabled,
                ]}
              >
                {/* Number Display */}
                <Text
                  style={[
                    styles.numText,
                    hasBet ? styles.numTextSelected : styles.numTextUnselected,
                    isWinner && styles.numTextWinner,
                  ]}
                >
                  {num}
                </Text>

                {/* Unselected underline indicator */}
                {!hasBet && <View style={styles.unselectedUnderline} />}

                {/* Selected bet amount badge with coin */}
                {hasBet && (
                  <View style={styles.betBadgeRow}>
                    <Text style={styles.betAmountText}>{betAmount}</Text>
                    <Text style={styles.betCoinIcon}>🪙</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  boardContainer: {
    paddingHorizontal: 8,
    marginVertical: 4,
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  card: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
    position: 'relative',
  },
  cardUnselected: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000000',
  },
  cardSelected: {
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#60A5FA',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.4,
  },
  cardWinner: {
    backgroundColor: '#F59E0B',
    borderColor: '#FEF08A',
    borderWidth: 2.5,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  cardDisabled: {
    opacity: 0.85,
  },
  numText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  numTextUnselected: {
    color: '#0F172A',
  },
  numTextSelected: {
    color: '#FFFFFF',
  },
  numTextWinner: {
    color: '#78350F',
    fontSize: 16,
    fontWeight: '900',
  },
  unselectedUnderline: {
    width: 14,
    height: 2.5,
    backgroundColor: '#64748B',
    borderRadius: 1.5,
    marginTop: 2,
  },
  betBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
    marginTop: 1,
  },
  betAmountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  betCoinIcon: {
    fontSize: 8,
  },
});
