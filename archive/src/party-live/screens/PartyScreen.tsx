import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radii, spacing, type } from '../theme';

export interface PartyRoomSummary {
  id: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  category: string;
  mode: 'video' | 'voice';
  seatCount: number;
  seatedCount: number;
  listenerCount: number;
  isHot?: boolean;
  coverGradient?: [string, string];
}

const SAMPLE_ROOMS: PartyRoomSummary[] = [
  {
    id: 'RYDA-VIDEO-99',
    title: '📹 Late Night Video Hangout & Faces',
    hostName: 'Chloe & Friends',
    category: 'Chill & Chat',
    mode: 'video',
    seatCount: 6,
    seatedCount: 5,
    listenerCount: 1840,
    isHot: true,
    coverGradient: ['#6B21A8', '#1E1B4B'],
  },
  {
    id: 'RYDA-VOICE-88',
    title: '🎙️ Midnight Lo-Fi Audio Chill Lounge',
    hostName: 'DJ Phoenix',
    category: 'Music Beats',
    mode: 'voice',
    seatCount: 8,
    seatedCount: 4,
    listenerCount: 1420,
    isHot: true,
    coverGradient: ['#3B185F', '#1E1440'],
  },
  {
    id: 'RYDA-VIDEO-77',
    title: '🎤 Video Karaoke Star Face-Off Live',
    hostName: 'Aria Song',
    category: 'Sing & Karaoke',
    mode: 'video',
    seatCount: 6,
    seatedCount: 6,
    listenerCount: 980,
    isHot: true,
    coverGradient: ['#9D174D', '#3B0764'],
  },
  {
    id: 'RYDA-VOICE-66',
    title: '💬 Language & Cultural Banter',
    hostName: 'Kenji & Mei',
    category: 'Language Exchange',
    mode: 'voice',
    seatCount: 8,
    seatedCount: 5,
    listenerCount: 540,
    isHot: false,
    coverGradient: ['#1E293B', '#0F172A'],
  },
  {
    id: 'RYDA-VIDEO-55',
    title: '🎮 Multiplayer Squad Reaction Stream',
    hostName: 'ViperX',
    category: 'Gaming Lounge',
    mode: 'video',
    seatCount: 4,
    seatedCount: 3,
    listenerCount: 710,
    isHot: false,
    coverGradient: ['#065F46', '#064E3B'],
  },
];

interface PartyScreenProps {
  onSelectRoom?: (room: PartyRoomSummary) => void;
  onCreateRoom?: (preferredMode: 'video' | 'voice') => void;
}

export function PartyScreen({ onSelectRoom, onCreateRoom }: PartyScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'voice'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredRooms = SAMPLE_ROOMS.filter((room) => {
    if (activeTab === 'video' && room.mode !== 'video') return false;
    if (activeTab === 'voice' && room.mode !== 'voice') return false;
    if (searchQuery.trim().length > 0) {
      return (
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const renderRoomCard = ({ item }: { item: PartyRoomSummary }) => {
    const isVideo = item.mode === 'video';

    return (
      <Pressable style={styles.roomCard} onPress={() => onSelectRoom?.(item)}>
        <LinearGradient
          colors={item.coverGradient || ['#3E2E6E', '#1E1440']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Badges */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            {/* Mode Tag: Video vs Voice */}
            <View style={[styles.modeBadge, isVideo ? styles.videoBadge : styles.voiceBadge]}>
              <Ionicons
                name={isVideo ? 'videocam' : 'mic'}
                size={11}
                color="#FFF"
                style={{ marginRight: 3 }}
              />
              <Text style={styles.modeBadgeText}>
                {isVideo ? 'Video Party' : 'Audio Room'}
              </Text>
            </View>

            {item.isHot && (
              <View style={styles.hotBadge}>
                <Ionicons name="flame" size={11} color="#FF6B6B" />
                <Text style={styles.hotText}>HOT</Text>
              </View>
            )}
          </View>

          {/* Listener Count */}
          <View style={styles.listenerPill}>
            <Ionicons name="headset" size={12} color={colors.gold} />
            <Text style={styles.listenerCount}>{item.listenerCount}</Text>
          </View>
        </View>

        {/* Room Title */}
        <Text style={styles.roomTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Footer info: Host & Seats */}
        <View style={styles.cardFooter}>
          <View style={styles.hostInfo}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostInitial}>{item.hostName[0]}</Text>
            </View>
            <Text style={styles.hostName} numberOfLines={1}>
              {item.hostName}
            </Text>
          </View>

          <View style={styles.seatInfo}>
            <Ionicons
              name={isVideo ? 'videocam-outline' : 'mic-outline'}
              size={13}
              color={colors.primaryLight}
            />
            <Text style={styles.seatCountText}>
              {item.seatedCount}/{item.seatCount}
            </Text>
          </View>
        </View>
    </Pressable>
  );
  };

  return (
    <View style={styles.root}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1F1142', '#120826', '#090414']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>Party Live</Text>
          <Text style={styles.headerSub}>Video & Audio Social Lounges</Text>
        </View>

        {/* Quick Start Floating Button */}
        <Pressable
          style={styles.createBtn}
          onPress={() => onCreateRoom?.(activeTab === 'video' ? 'video' : 'voice')}
        >
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createGradient}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.createText}>Start</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Mode Filters (All / Video Parties / Voice Lounges) */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All Parties', icon: 'sparkles' },
          { id: 'video', label: '📹 Video Parties', icon: 'videocam' },
          { id: 'voice', label: '🎙️ Audio Lounges', icon: 'mic' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search party rooms, hosts, categories..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Rooms List */}
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryLight}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="radio-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No party rooms found</Text>
            <Text style={styles.emptySub}>
              Be the first to start a {activeTab === 'video' ? 'Video' : 'Audio'} party!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E081F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  createBtn: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    paddingVertical: 4,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  roomCard: {
    height: 120,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  videoBadge: {
    backgroundColor: 'rgba(138, 79, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(198, 186, 232, 0.4)',
  },
  voiceBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.4)',
  },
  modeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    gap: 2,
  },
  hotText: {
    color: '#FF6B6B',
    fontSize: 9,
    fontWeight: '800',
  },
  listenerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  listenerCount: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  roomTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  hostAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitial: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  hostName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  seatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  seatCountText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
