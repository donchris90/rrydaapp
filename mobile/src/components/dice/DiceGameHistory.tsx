import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import type { DiceRoundHistory, RoundOutcomeType } from './luckyNumberTypes';

interface DiceGameHistoryProps {
  history: DiceRoundHistory[];
  onOpenFullHistory?: () => void;
}

export function DiceGameHistory({
  history,
  onOpenFullHistory,
}: DiceGameHistoryProps) {
  const [selectedRound, setSelectedRound] = useState<DiceRoundHistory | null>(null);

  // Take the last 10 rounds
  const last10 = history.slice(0, 10);

  // Summary counts for quick stats pill
  const winCount = last10.filter((r) => r.outcome === 'WIN').length;
  const loseCount = last10.filter((r) => r.outcome === 'LOSE').length;
  const noPlayCount = last10.filter(
    (r) => !r.outcome || r.outcome === 'NOT_PLAYED'
  ).length;

  const getOutcomeDetails = (outcome?: RoundOutcomeType) => {
    switch (outcome) {
      case 'WIN':
        return {
          icon: '🏆',
          label: 'WIN',
          textColor: '#4ADE80',
          badgeBg: 'rgba(34, 197, 94, 0.18)',
          borderColor: 'rgba(34, 197, 94, 0.5)',
          glowColor: 'rgba(34, 197, 94, 0.3)',
        };
      case 'LOSE':
        return {
          icon: '💔',
          label: 'LOSE',
          textColor: '#F87171',
          badgeBg: 'rgba(239, 68, 68, 0.18)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          glowColor: 'rgba(239, 68, 68, 0.3)',
        };
      case 'NOT_PLAYED':
      default:
        return {
          icon: '⚪',
          label: 'NO PLAY',
          textColor: '#94A3B8',
          badgeBg: 'rgba(148, 163, 184, 0.14)',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          glowColor: 'transparent',
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar with title and quick win/loss breakdown */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.titleIcon}>📊</Text>
          <Text style={styles.titleText}>LAST 10 ROUNDS</Text>
        </View>

        {/* Mini stats tracker */}
        <View style={styles.statsPill}>
          <View style={styles.statSegment}>
            <Text style={[styles.statValue, { color: '#4ADE80' }]}>{winCount}W</Text>
          </View>
          <Text style={styles.statDivider}>·</Text>
          <View style={styles.statSegment}>
            <Text style={[styles.statValue, { color: '#F87171' }]}>{loseCount}L</Text>
          </View>
          <Text style={styles.statDivider}>·</Text>
          <View style={styles.statSegment}>
            <Text style={[styles.statValue, { color: '#94A3B8' }]}>{noPlayCount}P</Text>
          </View>
        </View>

        {onOpenFullHistory && (
          <Pressable
            onPress={onOpenFullHistory}
            style={({ pressed }) => [
              styles.viewAllBtn,
              pressed && styles.viewAllBtnPressed,
            ]}
          >
            <Text style={styles.viewAllText}>All &gt;</Text>
          </Pressable>
        )}
      </View>

      {/* Chronological List of Last 10 Rounds */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {last10.map((item, index) => {
          const outcomeInfo = getOutcomeDetails(item.outcome);
          const isLatest = index === 0;

          return (
            <Pressable
              key={item.id || `hist-${item.roundNumber}-${index}`}
              onPress={() => setSelectedRound(item)}
              style={({ pressed }) => [
                styles.itemCard,
                {
                  borderColor: isLatest ? '#F59E0B' : outcomeInfo.borderColor,
                  backgroundColor: isLatest ? '#1A2362' : '#0F174A',
                },
                pressed && styles.itemCardPressed,
              ]}
            >
              {/* Latest Indicator Pill */}
              {isLatest && (
                <View style={styles.latestBadge}>
                  <Text style={styles.latestText}>LATEST</Text>
                </View>
              )}

              {/* Status Icon & Label */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: outcomeInfo.badgeBg,
                    borderColor: outcomeInfo.borderColor,
                  },
                ]}
              >
                <Text style={styles.statusIcon}>{outcomeInfo.icon}</Text>
                <Text
                  style={[styles.statusText, { color: outcomeInfo.textColor }]}
                  numberOfLines={1}
                >
                  {outcomeInfo.label}
                </Text>
              </View>

              {/* Sum & Category Pill */}
              <View style={styles.sumContainer}>
                <Text style={styles.sumNumber}>{item.sum}</Text>
                <Text style={styles.diceDetail}>
                  [{item.dice[0]},{item.dice[1]},{item.dice[2]}]
                </Text>
              </View>

              {/* Round number footer */}
              <View style={styles.itemFooter}>
                <Text style={styles.roundNumberText}>#{item.roundNumber}</Text>
                <Text style={styles.categoryTag}>
                  {item.isSmall ? 'S' : 'B'}·{item.isEven ? 'E' : 'O'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Detailed Outcome Modal when user taps an item */}
      <Modal
        visible={!!selectedRound}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRound(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedRound(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedRound && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Round #{selectedRound.roundNumber} Result
                  </Text>
                  <Pressable
                    onPress={() => setSelectedRound(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                {/* Outcome Badge in Modal */}
                <View style={styles.modalOutcomeRow}>
                  {(() => {
                    const info = getOutcomeDetails(selectedRound.outcome);
                    return (
                      <View
                        style={[
                          styles.modalOutcomeBadge,
                          {
                            backgroundColor: info.badgeBg,
                            borderColor: info.borderColor,
                          },
                        ]}
                      >
                        <Text style={styles.modalOutcomeIcon}>{info.icon}</Text>
                        <Text
                          style={[
                            styles.modalOutcomeText,
                            { color: info.textColor },
                          ]}
                        >
                          {info.label} STATUS
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                {/* 3 Dice visual */}
                <View style={styles.diceRow}>
                  {selectedRound.dice.map((d, i) => (
                    <View key={i} style={styles.diceBox}>
                      <Text style={styles.diceVal}>{d}</Text>
                    </View>
                  ))}
                  <Text style={styles.equalSign}>=</Text>
                  <View style={styles.sumBox}>
                    <Text style={styles.sumVal}>{selectedRound.sum}</Text>
                  </View>
                </View>

                {/* Attributes */}
                <View style={styles.attributesGrid}>
                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>RANGE</Text>
                    <Text
                      style={[
                        styles.attrVal,
                        { color: selectedRound.isSmall ? '#38BDF8' : '#F59E0B' },
                      ]}
                    >
                      {selectedRound.isSmall ? 'SMALL (0-13)' : 'BIG (14-27)'}
                    </Text>
                  </View>

                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>PARITY</Text>
                    <Text
                      style={[
                        styles.attrVal,
                        { color: selectedRound.isEven ? '#A78BFA' : '#FB7185' },
                      ]}
                    >
                      {selectedRound.isEven ? 'EVEN' : 'ODD'}
                    </Text>
                  </View>

                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>YOUR BET</Text>
                    <Text style={styles.attrVal}>
                      {selectedRound.userBetTotal
                        ? `${selectedRound.userBetTotal.toLocaleString()} 🪙`
                        : 'No Bet Placed'}
                    </Text>
                  </View>

                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>PAYOUT</Text>
                    <Text
                      style={[
                        styles.attrVal,
                        {
                          color:
                            (selectedRound.winAmount || 0) > 0
                              ? '#4ADE80'
                              : '#94A3B8',
                        },
                      ]}
                    >
                      {selectedRound.winAmount
                        ? `+${selectedRound.winAmount.toLocaleString()} 🪙`
                        : '0 🪙'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setSelectedRound(null)}
                  style={styles.modalDoneBtn}
                >
                  <Text style={styles.modalDoneText}>Close</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#0F1648',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleIcon: {
    fontSize: 13,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.8,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 95, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  statSegment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  statDivider: {
    fontSize: 10,
    color: '#64748B',
  },
  viewAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  viewAllBtnPressed: {
    opacity: 0.6,
  },
  viewAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  scrollList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  itemCard: {
    width: 78,
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  latestBadge: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF08A',
    zIndex: 2,
  },
  latestText: {
    color: '#1E1B4B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    marginTop: 2,
  },
  statusIcon: {
    fontSize: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sumContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  sumNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  diceDetail: {
    fontSize: 9,
    color: '#93C5FD',
    fontWeight: '600',
    marginTop: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 3,
    marginTop: 2,
  },
  roundNumberText: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '700',
  },
  categoryTag: {
    fontSize: 8,
    color: '#FCD34D',
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 28, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0F1648',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  modalOutcomeRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  modalOutcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  modalOutcomeIcon: {
    fontSize: 14,
  },
  modalOutcomeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#070B28',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  diceBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E295F',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  equalSign: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  sumBox: {
    width: 44,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sumVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  attributesGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 16,
  },
  attrItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attrLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  attrVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalDoneBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
});
