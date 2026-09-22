import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from './luckyNumberTheme';
import type { QuickBetType } from './luckyNumberTypes';

interface DiceTrendRowProps {
  trendLabel?: string;
  activeCategory: QuickBetType;
  onSelectCategory: (cat: 'S' | 'B' | 'E' | 'O') => void;
  onOpenHistory?: () => void;
  disabled?: boolean;
}

export function DiceTrendRow({
  trendLabel = '2S/1E',
  activeCategory,
  onSelectCategory,
  onOpenHistory,
  disabled = false,
}: DiceTrendRowProps) {
  const categories: { key: 'S' | 'B' | 'E' | 'O'; label: string }[] = [
    { key: 'S', label: 'S' },
    { key: 'B', label: 'B' },
    { key: 'E', label: 'E' },
    { key: 'O', label: 'O' },
  ];

  return (
    <View style={styles.container}>
      {/* Left Trend Indicator */}
      <View style={styles.trendPill}>
        <Text style={styles.trendPillText}>📈 {trendLabel}</Text>
      </View>

      {/* Center 4 Category Buttons (S, B, E, O) */}
      <View style={styles.categoryRow}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              disabled={disabled}
              onPress={() => onSelectCategory(cat.key)}
              style={({ pressed }) => [
                styles.categoryButton,
                isActive ? styles.categoryButtonActive : styles.categoryButtonInactive,
                pressed && styles.buttonPressed,
                disabled && styles.buttonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  isActive ? styles.categoryTextActive : styles.categoryTextInactive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Right History Button */}
      <Pressable
        onPress={onOpenHistory}
        style={({ pressed }) => [
          styles.historyButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.historyIcon}>🕒</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  trendPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  trendPillText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryButton: {
    width: 38,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryButtonActive: {
    backgroundColor: '#FACC15',
    borderWidth: 2,
    borderColor: '#FEF08A',
    shadowColor: '#EAB308',
  },
  categoryButtonInactive: {
    backgroundColor: '#FDE68A',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    opacity: 0.85,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '900',
  },
  categoryTextActive: {
    color: '#78350F',
  },
  categoryTextInactive: {
    color: '#B45309',
  },
  historyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIcon: {
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
