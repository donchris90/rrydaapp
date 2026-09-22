import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface LiveViewerItem {
  id: string;
  name: string;
  avatar: string;
  vipLevel?: number;
}

interface LiveHeaderProps {
  topInset: number;
  hostName: string;
  hostAvatar?: string;
  likesCount: number;
  viewersCount: number;
  viewers?: LiveViewerItem[];
  coinsEarned: number;
  onPressHost?: () => void;
  onPressViewers?: () => void;
  onPressRank?: () => void;
  onPressClose: () => void;
}

export function LiveHeader({
  topInset,
  hostName,
  hostAvatar,
  likesCount,
  viewersCount,
  viewers = [],
  coinsEarned,
  onPressHost,
  onPressViewers,
  onPressRank,
  onPressClose,
}: LiveHeaderProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <View style={[styles.container, { paddingTop: topInset + 6 }]}>
      {/* Top Row: Host Info Pill & Viewers / Close */}
      <View style={styles.topRow}>
        {/* Host Identity Pill */}
        <Pressable onPress={onPressHost} style={styles.hostPill}>
          <View style={styles.avatarBorder}>
            <Image
              source={{ uri: hostAvatar || defaultAvatar }}
              style={styles.hostAvatar}
            />
            <View style={styles.liveBadgeDot}>
              <View style={styles.liveInnerDot} />
            </View>
          </View>

          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>
              {hostName || 'Live Host'}
            </Text>
            <View style={styles.hostSubRow}>
              <Ionicons name="heart" size={10} color="#FF3D8A" />
              <Text style={styles.hostLikes}>
                {likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
              </Text>
              <Text style={styles.dotDivider}>•</Text>
              <Text style={styles.durationText}>{formatTimer(seconds)}</Text>
            </View>
          </View>

          <View style={styles.followMiniBtn}>
            <Ionicons name="add" size={14} color="#FFF" />
          </View>
        </Pressable>

        {/* Viewers Avatars Stack & Count */}
        <View style={styles.rightSection}>
          <Pressable onPress={onPressViewers} style={styles.viewersStack}>
            {viewers.slice(0, 3).map((v, i) => (
              <Image
                key={v.id || i}
                source={{ uri: v.avatar || `https://i.pravatar.cc/100?img=${i + 10}` }}
                style={[
                  styles.viewerAvatar,
                  { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i },
                  i === 0 && styles.topViewerBorder,
                ]}
              />
            ))}
            <View style={styles.viewerCountPill}>
              <Ionicons name="eye" size={11} color="#E0E0E0" />
              <Text style={styles.viewerCountText}>
                {viewersCount > 999 ? `${(viewersCount / 1000).toFixed(1)}k` : viewersCount}
              </Text>
            </View>
          </Pressable>

          {/* Close / End Button */}
          <Pressable onPress={onPressClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Sub Row: Ranking & Diamonds Ticker */}
      <View style={styles.subBar}>
        <Pressable onPress={onPressRank} style={styles.rankingPill}>
          <LinearGradient
            colors={['rgba(255, 194, 75, 0.28)', 'rgba(245, 166, 46, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rankingGradient}
          >
            <Ionicons name="trophy" size={12} color="#FFC24B" />
            <Text style={styles.rankingText}>Hourly Star #1</Text>
            <Ionicons name="chevron-forward" size={10} color="#FFC24B" />
          </LinearGradient>
        </Pressable>

        <View style={styles.coinsBadge}>
          <LinearGradient
            colors={['rgba(255, 61, 138, 0.28)', 'rgba(123, 77, 255, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.coinsGradient}
          >
            <Ionicons name="diamond" size={11} color="#FFD700" />
            <Text style={styles.coinsText}>{coinsEarned.toLocaleString()}</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 16, 42, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    maxWidth: 190,
  },
  avatarBorder: {
    position: 'relative',
  },
  hostAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#7B4DFF',
  },
  liveBadgeDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#120B26',
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B5C',
  },
  hostInfo: {
    marginLeft: 7,
    marginRight: 6,
    justifyContent: 'center',
  },
  hostName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 90,
  },
  hostSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  hostLikes: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  dotDivider: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
  },
  durationText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  followMiniBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3D8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewersStack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 16, 42, 0.65)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  viewerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: '#FFF',
  },
  topViewerBorder: {
    borderColor: '#FFC24B',
  },
  viewerCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 6,
    paddingRight: 2,
  },
  viewerCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rankingPill: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rankingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 75, 0.4)',
    borderRadius: 14,
  },
  rankingText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
  },
  coinsBadge: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  coinsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 138, 0.35)',
    borderRadius: 14,
  },
  coinsText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
