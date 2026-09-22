import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { getSumCombinationCount } from '../../utils/diceFairness';

interface DiceHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DiceHelpModal({ visible, onClose }: DiceHelpModalProps) {
  const numbers = Array.from({ length: 28 }, (_, i) => i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Sum Dice Rules</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Game Overview</Text>
              <Text style={styles.bodyText}>
                Each round, three digits (0–9) are drawn on the server and added together. The result is a number from 0 to 27.
              </Text>
            </View>

            {/* How a bet pays — this describes the real rule (see games/sum-dice-rules.ts).
                It used to claim category bets pay "1.95x" and printed a table of
                theoretical multipliers; the game pays neither. */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How bets work</Text>
              <Text style={styles.bodyText}>
                Pick any numbers you like. Your stake is split evenly across the numbers you pick. If the winning number is one of them, the share you put on that number is multiplied by the game's payout multiplier. If it isn't, the stake is lost.
              </Text>
              <Text style={[styles.bodyText, { marginTop: 8 }]}>
                Picking more numbers raises your chance of hitting one, but each number then carries a smaller share of your stake. Any tiny remainder from an uneven split is not paid out. Winnings are shown once the round settles.
              </Text>
            </View>

            {/* Quick pick buttons */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick-pick buttons</Text>
              <Text style={styles.bodyText}>These just select a group of numbers for you; they are not separate bets.</Text>
              <View style={styles.categoryGrid}>
                <View style={styles.catCard}>
                  <Text style={styles.catHeader}>S (Small)</Text>
                  <Text style={styles.catDesc}>Sums 0 to 13</Text>
                  <Text style={styles.catOdds}>14 numbers</Text>
                </View>
                <View style={styles.catCard}>
                  <Text style={styles.catHeader}>B (Big)</Text>
                  <Text style={styles.catDesc}>Sums 14 to 27</Text>
                  <Text style={styles.catOdds}>14 numbers</Text>
                </View>
                <View style={styles.catCard}>
                  <Text style={styles.catHeader}>E (Even)</Text>
                  <Text style={styles.catDesc}>Even sums 0, 2 … 26</Text>
                  <Text style={styles.catOdds}>14 numbers</Text>
                </View>
                <View style={styles.catCard}>
                  <Text style={styles.catHeader}>O (Odd)</Text>
                  <Text style={styles.catDesc}>Odd sums 1, 3 … 27</Text>
                  <Text style={styles.catOdds}>14 numbers</Text>
                </View>
              </View>
            </View>

            {/* How likely each number is (pure counting, out of the 1000 possible digit triples) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How likely each number is</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, { flex: 1 }]}>Number</Text>
                <Text style={[styles.thCell, { flex: 2 }]}>Ways to make it</Text>
              </View>
              {numbers.map((num) => (
                <View key={`mult-${num}`} style={styles.tableRow}>
                  <Text style={[styles.tdCell, { flex: 1, fontWeight: '800' }]}>{num}</Text>
                  <Text style={[styles.tdCell, { flex: 2, color: '#94A3B8' }]}>{getSumCombinationCount(num)} / 1000</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#1E2563',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: '#141A4B',
    padding: 12,
    borderRadius: 14,
  },
  sectionTitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  bodyText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E2B7A',
    padding: 10,
    borderRadius: 10,
  },
  catHeader: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: '900',
  },
  catDesc: {
    color: '#94A3B8',
    fontSize: 10,
    marginVertical: 2,
  },
  catOdds: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '800',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  thCell: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tdCell: {
    color: '#F8FAFC',
    fontSize: 12,
    textAlign: 'center',
  },
});
