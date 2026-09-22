import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchBigWins } from '../../api/games';

interface DiceLeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
}

// The biggest recent payouts in this game, straight from the backend. The
// backend records the winner's id but there is no public name lookup, so
// wins are listed anonymously by amount — this used to show seven made-up
// players ("ViperKing", "LunaStar", ...) with invented VIP badges and totals.
export function DiceLeaderboardModal({ visible, onClose }: DiceLeaderboardModalProps) {
  const winsQuery = useQuery({
    queryKey: ['games', 'SUM_DICE', 'big-wins'],
    queryFn: () => fetchBigWins('SUM_DICE'),
    enabled: visible,
  });
  const wins = [...(winsQuery.data ?? [])].sort((a, b) => b.rewardAmount - a.rewardAmount);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.trophyIcon}>🏆</Text>
              <Text style={styles.title}>Biggest Recent Wins</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {winsQuery.isLoading ? (
            <ActivityIndicator color="#60A5FA" style={{ margin: 24 }} />
          ) : winsQuery.isError ? (
            <Text style={styles.emptyText}>Could not load recent wins.</Text>
          ) : wins.length === 0 ? (
            <Text style={styles.emptyText}>No big wins yet — be the first.</Text>
          ) : (
            <FlatList
              data={wins}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => (
                <View style={styles.leaderRow}>
                  <Text style={styles.rankNum}>{index + 1}</Text>
                  <View style={styles.nameCol}>
                    <Text style={styles.playerName}>Round {item.roundId.slice(0, 6).toUpperCase()}</Text>
                    <Text style={styles.badgeText}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.coinTotal}>+{item.rewardAmount.toLocaleString()} 🪙</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  emptyText: { color: '#94A3B8', textAlign: 'center', padding: 24, fontSize: 14 },
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trophyIcon: {
    fontSize: 20,
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
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#141A4B',
    gap: 16,
  },
  podiumColumn: {
    alignItems: 'center',
    width: 76,
  },
  podiumRank1: {
    marginBottom: 0,
  },
  podiumRank2: {
    marginBottom: 0,
  },
  podiumRank3: {
    marginBottom: 0,
  },
  podiumCrown: {
    fontSize: 16,
    marginBottom: -4,
  },
  podiumAvatar: {
    fontSize: 24,
  },
  podiumName: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 4,
  },
  podiumPillar: {
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRankText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  podiumCoins: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  listContent: {
    padding: 12,
    gap: 6,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#273180',
    padding: 10,
    borderRadius: 12,
  },
  rankNum: {
    width: 24,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  avatarIcon: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  nameCol: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeText: {
    color: '#FACC15',
    fontSize: 9,
    fontWeight: '800',
  },
  coinTotal: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '800',
  },
});
