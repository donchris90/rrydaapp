import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList } from 'react-native';
import { colors } from './luckyNumberTheme';
import type { DiceRoundHistory } from './luckyNumberTypes';

interface DiceHistoryModalProps {
  visible: boolean;
  history: DiceRoundHistory[];
  onClose: () => void;
}

export function DiceHistoryModal({ visible, history, onClose }: DiceHistoryModalProps) {
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
            <Text style={styles.title}>Round History & Trends</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Stats Summary */}
          <View style={styles.statsSummaryRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {history.filter((h) => h.isSmall).length}
              </Text>
              <Text style={styles.statLbl}>Small (0-13)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {history.filter((h) => !h.isSmall).length}
              </Text>
              <Text style={styles.statLbl}>Big (14-27)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {history.filter((h) => h.isEven).length}
              </Text>
              <Text style={styles.statLbl}>Even</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {history.filter((h) => !h.isEven).length}
              </Text>
              <Text style={styles.statLbl}>Odd</Text>
            </View>
          </View>

          {/* History List */}
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.historyRow}>
                <View style={styles.roundInfoCol}>
                  <Text style={styles.roundNum}>#{item.roundNumber}</Text>
                  <Text style={styles.diceDetail}>
                    {item.dice[0]} + {item.dice[1]} + {item.dice[2]}
                  </Text>
                </View>

                {/* Sum Badge */}
                <View style={styles.sumBadge}>
                  <Text style={styles.sumText}>{item.sum}</Text>
                </View>

                {/* Badges */}
                <View style={styles.tagsCol}>
                  <View
                    style={[
                      styles.tagPill,
                      item.isSmall ? styles.tagSmall : styles.tagBig,
                    ]}
                  >
                    <Text style={styles.tagText}>
                      {item.isSmall ? 'S' : 'B'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tagPill,
                      item.isEven ? styles.tagEven : styles.tagOdd,
                    ]}
                  >
                    <Text style={styles.tagText}>
                      {item.isEven ? 'E' : 'O'}
                    </Text>
                  </View>
                </View>

                {/* Provably fair hash sample */}
                <View style={styles.hashCol}>
                  <Text style={styles.hashText} numberOfLines={1}>
                    {item.hash.substring(0, 10)}...
                  </Text>
                </View>
              </View>
            )}
          />
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
    maxHeight: '80%',
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
    fontSize: 18,
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
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#141A4B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    color: '#FACC15',
    fontSize: 16,
    fontWeight: '800',
  },
  statLbl: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#273180',
    padding: 10,
    borderRadius: 12,
  },
  roundInfoCol: {
    width: 65,
  },
  roundNum: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  diceDetail: {
    color: '#94A3B8',
    fontSize: 10,
  },
  sumBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sumText: {
    color: '#082F49',
    fontSize: 14,
    fontWeight: '900',
  },
  tagsCol: {
    flexDirection: 'row',
    gap: 5,
  },
  tagPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagSmall: {
    backgroundColor: '#3B82F6',
  },
  tagBig: {
    backgroundColor: '#EC4899',
  },
  tagEven: {
    backgroundColor: '#8B5CF6',
  },
  tagOdd: {
    backgroundColor: '#F59E0B',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  hashCol: {
    width: 75,
    alignItems: 'flex-end',
  },
  hashText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
