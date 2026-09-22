import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface StreamStats {
  durationMinutes: number;
  totalViewers: number;
  peakViewers: number;
  diamondsEarned: number;
  totalLikes: number;
  newFollowers: number;
  topGifters?: {
    id: string;
    name: string;
    avatar: string;
    amount: number;
  }[];
}

interface StreamSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  hostName: string;
  hostAvatar?: string;
  stats: StreamStats;
}

export function StreamSummaryModal({
  visible,
  onClose,
  hostName,
  hostAvatar,
  stats,
}: StreamSummaryModalProps) {
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#2A1E52', '#140E29']}
            style={styles.cardGradient}
          >
            {/* Host Avatar with Trophy */}
            <View style={styles.avatarWrap}>
              <Image source={{ uri: hostAvatar || defaultAvatar }} style={styles.avatar} />
              <View style={styles.trophyBadge}>
                <Ionicons name="sparkles" size={14} color="#FFD700" />
              </View>
            </View>

            <Text style={styles.title}>Broadcast Ended</Text>
            <Text style={styles.hostNameText}>Great show, {hostName}!</Text>

            {/* Metrics 2x3 Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="time-outline" size={18} color="#FFC24B" />
                <Text style={styles.statVal}>{stats.durationMinutes}m</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="people-outline" size={18} color="#00E5FF" />
                <Text style={styles.statVal}>{stats.totalViewers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Viewers</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="flame-outline" size={18} color="#FF3D8A" />
                <Text style={styles.statVal}>{stats.peakViewers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Peak Viewers</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="diamond-outline" size={18} color="#FFD700" />
                <Text style={styles.statVal}>{stats.diamondsEarned.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Diamonds</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="heart-outline" size={18} color="#FF2A6D" />
                <Text style={styles.statVal}>
                  {stats.totalLikes > 999
                    ? `${(stats.totalLikes / 1000).toFixed(1)}k`
                    : stats.totalLikes}
                </Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="person-add-outline" size={18} color="#3DF5A0" />
                <Text style={styles.statVal}>+{stats.newFollowers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>

            {/* Top Gifters Podium */}
            {stats.topGifters && stats.topGifters.length > 0 && (
              <View style={styles.giftersSection}>
                <Text style={styles.giftersTitle}>Top Contributors</Text>
                <View style={styles.giftersRow}>
                  {stats.topGifters.slice(0, 3).map((g, idx) => (
                    <View key={g.id || idx} style={styles.gifterCol}>
                      <View style={styles.gifterAvatarBorder}>
                        <Image source={{ uri: g.avatar }} style={styles.gifterAvatar} />
                        <View style={[styles.rankTag, idx === 0 ? styles.rank1 : styles.rank2]}>
                          <Text style={styles.rankNum}>{idx + 1}</Text>
                        </View>
                      </View>
                      <Text style={styles.gifterName} numberOfLines={1}>
                        {g.name}
                      </Text>
                      <Text style={styles.gifterAmount}>{g.amount.toLocaleString()} 💎</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action buttons */}
            <Pressable onPress={onClose} style={styles.primaryBtn}>
              <LinearGradient
                colors={['#7B4DFF', '#FF3D8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.btnText}>Return to Home</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 22, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#7B4DFF',
  },
  trophyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1E163B',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  hostNameText: {
    color: '#B0A6D6',
    fontSize: 14,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    width: '31%',
    backgroundColor: 'rgba(36, 26, 61, 0.65)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statVal: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    color: '#9490A6',
    fontSize: 10,
    fontWeight: '600',
  },
  giftersSection: {
    width: '100%',
    marginBottom: 20,
  },
  giftersTitle: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  giftersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  gifterCol: {
    alignItems: 'center',
    width: 80,
  },
  gifterAvatarBorder: {
    position: 'relative',
    marginBottom: 4,
  },
  gifterAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  rankTag: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank1: {
    backgroundColor: '#FFD700',
  },
  rank2: {
    backgroundColor: '#C0C0C0',
  },
  rankNum: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  gifterName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  gifterAmount: {
    color: '#FFC24B',
    fontSize: 10,
    fontWeight: '700',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
