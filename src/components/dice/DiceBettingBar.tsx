import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { colors } from './luckyNumberTheme';
import type { DiceRoundStatus } from './luckyNumberTypes';

interface DiceBettingBarProps {
  currentChip: number;
  totalBet: number;
  balance: number;
  roundStatus: DiceRoundStatus;
  hasPlacedBet: boolean;
  onSelectChip: (chip: number) => void;
  onIncreaseBet: () => void;
  onDecreaseBet: () => void;
  onConfirmBet: () => void;
  onClearBets: () => void;
  onDoubleBets: () => void;
}

const CHIP_OPTIONS = [10, 50, 100, 500, 1000, 5000, 10000];

export function DiceBettingBar({
  currentChip,
  totalBet,
  balance,
  roundStatus,
  hasPlacedBet,
  onSelectChip,
  onIncreaseBet,
  onDecreaseBet,
  onConfirmBet,
  onClearBets,
  onDoubleBets,
}: DiceBettingBarProps) {
  const [showChipModal, setShowChipModal] = useState(false);
  const isRolling = roundStatus === 'ROLLING';
  const canBet = roundStatus === 'OPEN' && totalBet > 0 && balance >= totalBet && !hasPlacedBet;

  return (
    <View style={styles.outerContainer}>
      {/* Secondary Quick Action Controls (Clear / Double) */}
      <View style={styles.quickUtilityRow}>
        <Pressable
          disabled={totalBet === 0 || hasPlacedBet || isRolling}
          onPress={onClearBets}
          style={({ pressed }) => [
            styles.utilityButton,
            (totalBet === 0 || hasPlacedBet || isRolling) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.utilityText}>Clear</Text>
        </Pressable>

        <Pressable
          disabled={totalBet === 0 || hasPlacedBet || isRolling || balance < totalBet * 2}
          onPress={onDoubleBets}
          style={({ pressed }) => [
            styles.utilityButton,
            (totalBet === 0 || hasPlacedBet || isRolling || balance < totalBet * 2) &&
              styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.utilityText}>2X Double</Text>
        </Pressable>
      </View>

      {/* Main Betting Bar exactly like Poppo Screenshot */}
      <View style={styles.mainBar}>
        {/* Left Chip Selector (e.g. 9,336 🪙 >) */}
        <Pressable
          onPress={() => setShowChipModal(true)}
          style={({ pressed }) => [
            styles.chipSelector,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.chipText}>{currentChip.toLocaleString()}</Text>
          <Text style={styles.chipCoin}>🪙</Text>
          <Text style={styles.chipChevron}>›</Text>
        </Pressable>

        {/* Minus Button */}
        <Pressable
          disabled={hasPlacedBet || isRolling}
          onPress={onDecreaseBet}
          style={({ pressed }) => [
            styles.stepperButton,
            (hasPlacedBet || isRolling) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.stepperIcon}>—</Text>
        </Pressable>

        {/* Big Coral/Red Bet Button */}
        <Pressable
          disabled={!canBet && !hasPlacedBet}
          onPress={onConfirmBet}
          style={({ pressed }) => [
            styles.betButton,
            hasPlacedBet && styles.betButtonPlaced,
            isRolling && styles.betButtonRolling,
            !canBet && !hasPlacedBet && styles.betButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.betButtonText}>
            {isRolling
              ? 'Rolling...'
              : hasPlacedBet
              ? `In Play (${totalBet.toLocaleString()})`
              : `Bet ${totalBet > 0 ? totalBet.toLocaleString() : currentChip}`}
          </Text>
          <Text style={styles.betButtonCoin}>🪙</Text>
        </Pressable>

        {/* Plus Button */}
        <Pressable
          disabled={hasPlacedBet || isRolling}
          onPress={onIncreaseBet}
          style={({ pressed }) => [
            styles.stepperButton,
            (hasPlacedBet || isRolling) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.stepperIcon}>+</Text>
        </Pressable>
      </View>

      {/* Chip Picker Modal Sheet */}
      <Modal
        visible={showChipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChipModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowChipModal(false)}
        >
          <View style={styles.chipSheet}>
            <Text style={styles.chipSheetTitle}>Select Chip Value</Text>
            <View style={styles.chipGrid}>
              {CHIP_OPTIONS.map((chip) => {
                const isSelected = currentChip === chip;
                return (
                  <Pressable
                    key={`chip-${chip}`}
                    onPress={() => {
                      onSelectChip(chip);
                      setShowChipModal(false);
                    }}
                    style={[
                      styles.chipOption,
                      isSelected && styles.chipOptionSelected,
                    ]}
                  >
                    <Text style={styles.chipOptionCoin}>🪙</Text>
                    <Text
                      style={[
                        styles.chipOptionText,
                        isSelected && styles.chipOptionTextSelected,
                      ]}
                    >
                      {chip >= 1000 ? `${chip / 1000}k` : chip}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  quickUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 6,
  },
  utilityButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  utilityText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chipSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  chipText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  chipCoin: {
    fontSize: 13,
  },
  chipChevron: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FACC15',
    borderWidth: 2,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  stepperIcon: {
    color: '#78350F',
    fontSize: 20,
    fontWeight: '900',
  },
  betButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FF4E6E',
    borderWidth: 2,
    borderColor: '#FDA4AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#FF4E6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  betButtonPlaced: {
    backgroundColor: '#10B981',
    borderColor: '#6EE7B7',
    shadowColor: '#10B981',
  },
  betButtonRolling: {
    backgroundColor: '#8B5CF6',
    borderColor: '#C4B5FD',
    shadowColor: '#8B5CF6',
  },
  betButtonDisabled: {
    backgroundColor: '#475569',
    borderColor: '#64748B',
    shadowOpacity: 0,
    elevation: 0,
  },
  betButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  betButtonCoin: {
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  chipSheet: {
    backgroundColor: '#1E2563',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  chipSheetTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  chipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  chipOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  chipOptionCoin: {
    fontSize: 14,
  },
  chipOptionText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '800',
  },
  chipOptionTextSelected: {
    color: '#FFFFFF',
  },
});
