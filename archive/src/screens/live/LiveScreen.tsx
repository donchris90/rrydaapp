import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { PressableScale } from '../../components/PressableScale';
import type { AppStackParamList } from '../../navigation/types';
import { colors, spacing, radii, type } from '../../theme';

type LiveScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Live'>;

export function LiveScreen() {
  const navigation = useNavigation<LiveScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Background — video frame placeholder */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80' }}
        style={StyleSheet.absoluteFill}
        blurRadius={2}
      />
      <View style={styles.dimOverlay} />

      {/* ── TOP BAR ────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
        <Avatar uri="https://i.pravatar.cc/150?img=1" size={36} />
        <View style={styles.topBarText}>
          <View style={styles.hostNameRow}>
            <Text style={styles.hostName}>Ch 🌟</Text>
            <View style={styles.miniHeart}>
              <Ionicons name="heart" size={10} color="#FFF" />
            </View>
            <Text style={styles.heartCount}>0</Text>
          </View>
        </View>

        {/* Pink heart button */}
        <Pressable style={styles.pinkHeartBtn}>
          <Ionicons name="heart" size={18} color="#FFF" />
        </Pressable>

        {/* Trophy button */}
        <Pressable style={styles.trophyBtn}>
          <Ionicons name="trophy" size={18} color="#FFF" />
        </Pressable>

        <View style={styles.coinCount}>
          <Text style={styles.coinText}>0</Text>
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* ── HOUR / PK / PERCENTAGE BAR ─────────────────────── */}
      <View style={styles.statsBar}>
        <View style={styles.hourBadge}>
          <Ionicons name="flame" size={12} color="#FFD700" />
          <Text style={styles.hourText}>Hour 100+</Text>
        </View>
        <View style={styles.pkBadge}>
          <Ionicons name="git-compare" size={10} color="#FFF" />
          <Text style={styles.pkBadgeText}>5</Text>
        </View>
        <Text style={styles.percentText}>16.48%</Text>

        {/* Live tag right side */}
        <View style={styles.liveTagWrap}>
          <Text style={styles.liveTagText}>~LEVI~</Text>
          <Text style={styles.liveTagSub}>sent Mikasa... 1.5k</Text>
        </View>
      </View>

      {/* ── TEAM / SHARE ROW ───────────────────────────────── */}
      <View style={styles.teamRow}>
        <View style={styles.teamBadge}>
          <Ionicons name="home" size={14} color="#FFF" />
          <View>
            <Text style={styles.teamLabel}>Team U...</Text>
            <Text style={styles.teamScore}>0/12</Text>
          </View>
        </View>
        <View style={styles.shareBadge}>
          <Text style={styles.shareTitle}>#Share Poppo Glory</Text>
          <Text style={styles.shareSub}>Post and win up to 8,000</Text>
          <Text style={styles.shareDate}>24/08/15/08</Text>
        </View>
      </View>

      {/* ── FLOATING BANNERS ───────────────────────────────── */}
      <View style={styles.floatArea}>
        {/* Join my fans club */}
        <LinearGradient
          colors={['#B06AB3', '#E0A9F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fanClubBanner}
        >
          <Ionicons name="megaphone" size={12} color="#FFF" />
          <Text style={styles.fanClubText}>Join my fans club</Text>
        </LinearGradient>

        {/* OBSACHE gift row */}
        <View style={styles.giftRow}>
          <View style={styles.giftAvatarDot}>
            <Ionicons name="star" size={10} color="#FFF" />
          </View>
          <Text style={styles.giftRowText}>OBSACHE: 🎁🎁🎁</Text>
        </View>

        {/* Taxмина won banner */}
        <LinearGradient
          colors={['#FFB347', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.wonBanner}
        >
          <Avatar uri="https://i.pravatar.cc/150?img=5" size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.wonName}>Taxмина M... sent 🎁</Text>
            <Text style={styles.wonAmount}>won 103,000 💰</Text>
          </View>
          <Text style={styles.wonIcon}>HALLOWAR</Text>
        </LinearGradient>

        {/* Bety family banner */}
        <LinearGradient
          colors={['#8A2BE2', '#FF1493']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.familyBanner}
        >
          <Avatar uri="https://i.pravatar.cc/150?img=9" size={22} />
          <Text style={styles.familyText}>Bety 🦋... 80k👨‍👩‍👧‍👦👨‍👩‍👧‍👦</Text>
        </LinearGradient>
      </View>

      {/* ── CHAT / SYSTEM MESSAGE AREA ─────────────────────── */}
      <View style={styles.chatArea}>
        {/* Side tabs */}
        <View style={styles.sideTabs}>
          <View style={[styles.sideTab, styles.sideTabActive]}>
            <Text style={styles.sideTabTextActive}>All</Text>
          </View>
          <View style={styles.sideTab}>
            <Text style={styles.sideTabText}>Room</Text>
          </View>
          <View style={styles.sideTab}>
            <Text style={styles.sideTabText}>Chat</Text>
          </View>
        </View>

        {/* System messages */}
        <View style={styles.systemBox}>
          <Text style={styles.systemText}>
            <Text style={styles.warningText}>Cam rooms are strictly prohibited.</Text>
            {'\n'}Administrators monitor the feed 24/7. Reported contents and violations will be severely penalized.
          </Text>
        </View>
        <View style={styles.systemBox}>
          <Text style={styles.systemText}>
            <Text style={styles.boostText}>🔊 Like Boost is active!</Text> Encourage viewers to double-tap for likes to boost traffic.
          </Text>
        </View>

        {/* Joined row */}
        <View style={styles.joinedRow}>
          <View style={styles.joinedBadge}>
            <Ionicons name="heart" size={10} color="#FFF" />
            <Text style={styles.joinedBadgeText}>24</Text>
          </View>
          <Text style={styles.joinedText}>Ch 👑👑💰 Joined</Text>
        </View>
      </View>

      {/* ── BOTTOM ACTION BAR ──────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable style={styles.bottomIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFF" />
        </Pressable>
        <Pressable style={styles.bottomIcon}>
          <Ionicons name="mic-outline" size={26} color="#FFF" />
        </Pressable>
        <Pressable style={styles.bottomIcon}>
          <Ionicons name="grid-outline" size={26} color="#FFF" />
        </Pressable>
        <Pressable style={styles.bottomIcon}>
          <Ionicons name="search-outline" size={26} color="#FFF" />
        </Pressable>

        {/* PK */}
        <Pressable style={styles.bottomIcon}>
          <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.pkCircle}>
            <Text style={styles.pkLabel}>PK</Text>
          </LinearGradient>
        </Pressable>

        {/* Gift */}
        <Pressable style={styles.bottomIcon}>
          <LinearGradient colors={['#FF4D4D', '#FF1493']} style={styles.giftCircle}>
            <Ionicons name="gift" size={18} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  dimOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  topBarText: { flex: 1 },
  hostNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hostName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  miniHeart: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF1493', alignItems: 'center', justifyContent: 'center' },
  heartCount: { color: '#FFF', fontSize: 10 },
  pinkHeartBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF1493', alignItems: 'center', justifyContent: 'center' },
  trophyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,215,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  coinCount: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  coinText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  // Stats bar
  statsBar: {
    position: 'absolute',
    top: 78,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hourBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hourText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  pkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pkBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  percentText: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
  liveTagWrap: { flex: 1, alignItems: 'flex-end' },
  liveTagText: { color: '#FF69B4', fontSize: 10, fontWeight: '600' },
  liveTagSub: { color: '#FFD700', fontSize: 9 },

  // Team row
  teamRow: {
    position: 'absolute',
    top: 108,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,165,0,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  teamLabel: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  teamScore: { color: '#FFF', fontSize: 9 },
  shareBadge: {
    backgroundColor: 'rgba(138,43,226,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  shareTitle: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  shareSub: { color: '#FFF', fontSize: 9 },
  shareDate: { color: '#FFD700', fontSize: 8, marginTop: 2 },

  // Floating banners
  floatArea: {
    position: 'absolute',
    top: 160,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  fanClubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fanClubText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-end',
  },
  giftAvatarDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1E90FF', alignItems: 'center', justifyContent: 'center' },
  giftRowText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  wonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    width: '80%',
  },
  wonName: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  wonAmount: { color: '#FFD700', fontSize: 11, fontWeight: '800' },
  wonIcon: { color: '#1E90FF', fontSize: 9, fontWeight: '800' },
  familyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  familyText: { color: '#FFF', fontSize: 11, fontWeight: '600' },

  // Chat area
  chatArea: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  sideTabs: {
    position: 'absolute',
    left: 0,
    bottom: 40,
    gap: 2,
  },
  sideTab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sideTabActive: { backgroundColor: '#6B4EFF' },
  sideTabText: { color: '#AAA', fontSize: 10 },
  sideTabTextActive: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  systemBox: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: spacing.sm,
    borderRadius: 8,
    marginLeft: 50,
  },
  systemText: { color: '#AAA', fontSize: 11, lineHeight: 16 },
  warningText: { color: '#00E5FF', fontWeight: '700' },
  boostText: { color: '#FFD700', fontWeight: '700' },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 50,
    marginTop: spacing.xs,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FF1493',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  joinedBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  joinedText: { color: '#FFF', fontSize: 11, fontWeight: '600' },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomIcon: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  pkCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pkLabel: { color: '#000', fontSize: 11, fontWeight: '900' },
  giftCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});