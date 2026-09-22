import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import type { RoundResultSummary } from './luckyNumberTypes';

interface DiceResultBoardProps {
  visible: boolean;
  result: RoundResultSummary | null;
  countdownSeconds?: number;
  onClose: () => void;
  onPlayAgain?: () => void;
}

export function DiceResultBoard({
  visible,
  result,
  countdownSeconds = 4,
  onClose,
  onPlayAgain,
}: DiceResultBoardProps) {
  if (!result || !visible) return null;

  const isWin = result.outcome === 'WIN';
  const isLose = result.outcome === 'LOSE';
  const isNotPlayed = result.outcome === 'NOT_PLAYED';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.cardContainer,
            isWin && styles.cardWin,
            isLose && styles.cardLose,
            isNotPlayed && styles.cardNotPlayed,
          ]}
        >
          {/* Close corner button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }: { pressed: boolean }) => [
              styles.closeBtn,
              pressed && styles.closeBtnPressed,
            ]}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>

          {/* Top Floating Badge */}
          <View
            style={[
              styles.topBadge,
              isWin && styles.topBadgeWin,
              isLose && styles.topBadgeLose,
              isNotPlayed && styles.topBadgeNotPlayed,
            ]}
          >
            <Text style={styles.topBadgeText}>
              {isWin
                ? '🎉 WINNER!'
                : isLose
                ? '💔 ROUND OVER'
                : '👀 SPECTATOR MODE'}
            </Text>
          </View>

          {/* Header Title */}
          <Text
            style={[
              styles.mainTitle,
              isWin && styles.titleWin,
              isLose && styles.titleLose,
              isNotPlayed && styles.titleNotPlayed,
            ]}
          >
            {isWin
              ? 'CONGRATULATIONS!'
              : isLose
              ? 'BETTER LUCK NEXT TIME!'
              : 'YOU SAT OUT THIS ROUND'}
          </Text>

          {/* Subtitle Message */}
          <Text style={styles.subMessage}>
            {isWin
              ? `You struck the winning number ${result.sum}!`
              : isLose
              ? `You lost your bet of ${result.betAmount.toLocaleString()} coins.`
              : 'No bet placed for this round.'}
          </Text>

          {/* Prominent Amount / Outcome Box */}
          <View
            style={[
              styles.amountBox,
              isWin && styles.amountBoxWin,
              isLose && styles.amountBoxLose,
              isNotPlayed && styles.amountBoxNotPlayed,
            ]}
          >
            {isWin ? (
              <>
                <Text style={styles.amountLabel}>TOTAL PAYOUT</Text>
                <Text style={styles.amountValueWin}>
                  +{result.payoutAmount.toLocaleString()} 🪙
                </Text>
                <Text style={styles.amountProfit}>
                  Net Profit: +{result.netProfit.toLocaleString()} 🪙
                </Text>
              </>
            ) : isLose ? (
              <>
                <Text style={styles.amountLabel}>TOTAL DEDUCTION</Text>
                <Text style={styles.amountValueLose}>
                  -{result.betAmount.toLocaleString()} 🪙
                </Text>
                <Text style={styles.amountLossTip}>
                  Multiplier was {result.multiplier}x
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.amountLabel}>ROUND #{result.roundNumber} RESULT</Text>
                <Text style={styles.amountValueNotPlayed}>
                  Winning Sum: {result.sum}
                </Text>
                <Text style={styles.amountSpectatorTip}>
                  Pays {result.multiplier}x • Enter next round to win!
                </Text>
              </>
            )}
          </View>

          {/* Outcome Breakdown Details */}
          <View style={styles.breakdownContainer}>
            {/* Dice roll row */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rolled Dice:</Text>
              <View style={styles.diceGroup}>
                <View style={styles.dieBadge}>
                  <Text style={styles.dieText}>{result.dice[0]}</Text>
                </View>
                <Text style={styles.plusSign}>+</Text>
                <View style={styles.dieBadge}>
                  <Text style={styles.dieText}>{result.dice[1]}</Text>
                </View>
                <Text style={styles.plusSign}>+</Text>
                <View style={styles.dieBadge}>
                  <Text style={styles.dieText}>{result.dice[2]}</Text>
                </View>
                <Text style={styles.equalSign}>=</Text>
                <View
                  style={[
                    styles.sumBadge,
                    isWin ? styles.sumBadgeWin : styles.sumBadgeDefault,
                  ]}
                >
                  <Text style={styles.sumBadgeText}>{result.sum}</Text>
                </View>
              </View>
            </View>

            {/* Category Tags */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Attributes:</Text>
              <View style={styles.tagsRow}>
                <View
                  style={[
                    styles.tagPill,
                    result.isSmall ? styles.tagSmall : styles.tagBig,
                  ]}
                >
                  <Text style={styles.tagText}>
                    {result.isSmall ? 'Small (0-13)' : 'Big (14-27)'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.tagPill,
                    result.isEven ? styles.tagEven : styles.tagOdd,
                  ]}
                >
                  <Text style={styles.tagText}>
                    {result.isEven ? 'Even' : 'Odd'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Player's Bet info if played */}
            {!isNotPlayed && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Your Staked Bet:</Text>
                <Text style={styles.detailValue}>
                  {result.betAmount.toLocaleString()} 🪙
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {isNotPlayed ? (
              <Pressable
                onPress={() => {
                  onClose();
                  if (onPlayAgain) onPlayAgain();
                }}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.primaryBtn,
                  styles.primaryBtnNotPlayed,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  Join Round #{result.roundNumber + 1}
                </Text>
              </Pressable>
            ) : isWin ? (
              <Pressable
                onPress={onClose}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.primaryBtn,
                  styles.primaryBtnWin,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  Collect & Continue ({countdownSeconds}s)
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  onClose();
                  if (onPlayAgain) onPlayAgain();
                }}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.primaryBtn,
                  styles.primaryBtnLose,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  Play Next Round ({countdownSeconds}s)
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 30, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    zIndex: 9999,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 20,
    paddingTop: 24,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  cardWin: {
    backgroundColor: '#1E1B4B',
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  cardLose: {
    backgroundColor: '#261226',
    borderColor: '#F43F5E',
    shadowColor: '#F43F5E',
  },
  cardNotPlayed: {
    backgroundColor: '#111E48',
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
  closeBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '800',
  },
  topBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  topBadgeWin: {
    backgroundColor: '#F59E0B',
  },
  topBadgeLose: {
    backgroundColor: '#BE123C',
  },
  topBadgeNotPlayed: {
    backgroundColor: '#0284C7',
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleWin: {
    color: '#FDE047',
  },
  titleLose: {
    color: '#FDA4AF',
  },
  titleNotPlayed: {
    color: '#7DD3FC',
  },
  subMessage: {
    color: '#CBD5E1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  amountBox: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  amountBoxWin: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  amountBoxLose: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  amountBoxNotPlayed: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  amountLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountValueWin: {
    color: '#4ADE80',
    fontSize: 28,
    fontWeight: '900',
  },
  amountProfit: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  amountValueLose: {
    color: '#FB7185',
    fontSize: 28,
    fontWeight: '900',
  },
  amountLossTip: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  amountValueNotPlayed: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '900',
  },
  amountSpectatorTip: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 2,
  },
  breakdownContainer: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 66, 0.6)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  diceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dieBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  plusSign: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  equalSign: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  sumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sumBadgeDefault: {
    backgroundColor: '#38BDF8',
  },
  sumBadgeWin: {
    backgroundColor: '#F59E0B',
  },
  sumBadgeText: {
    color: '#090D24',
    fontSize: 12,
    fontWeight: '900',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagSmall: {
    backgroundColor: '#2563EB',
  },
  tagBig: {
    backgroundColor: '#DB2777',
  },
  tagEven: {
    backgroundColor: '#7C3AED',
  },
  tagOdd: {
    backgroundColor: '#D97706',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  actionRow: {
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnWin: {
    backgroundColor: '#F59E0B',
  },
  primaryBtnLose: {
    backgroundColor: '#E11D48',
  },
  primaryBtnNotPlayed: {
    backgroundColor: '#0284C7',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
