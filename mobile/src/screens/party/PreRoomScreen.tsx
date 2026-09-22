import { describeApiError } from '../../api/errors';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createRoom } from '../../api/rooms';
import { fetchHonorRanking } from '../../api/ranking';
import { useAuth } from '../../auth/AuthContext';
import { useAgoraEngine } from '../../live/useAgoraEngine';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { LiveToolsSheet } from '../../components/LiveToolsSheet';
import { GradientButton } from '../../components/GradientButton';
import { colors, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

const ROOM_CATEGORIES = ['Chatting', 'Singing', 'Dancing', 'Gaming'];

// Seat-count choices rendered as layout previews (not generic icons) —
// each button shows an actual mini-grid of the resulting layout, so the
// choice is visually honest about what it produces.
const SEAT_OPTIONS = [
  { count: 4, cols: 2, rows: 2 },
  { count: 6, cols: 3, rows: 2 },
  { count: 8, cols: 4, rows: 2 },
  { count: 9, cols: 3, rows: 3 },
];

export function PreRoomScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PreRoom'>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<'video' | 'voice'>(route.params?.initialMode ?? 'video');
  const [seatCount, setSeatCount] = useState(8);
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);

  const {
    error,
    switchCamera,
    isMicMuted,
    toggleMic,
    isNoiseSuppressionOn,
    toggleNoiseSuppression,
    beauty,
    setBeauty,
    background,
    setBackground,
    faceShape,
    setFaceShape,
  } = useAgoraEngine({
    channelId: '',
    token: '',
    userAccount: user?.id ?? '',
    role: 'host',
  });

  // Real figures, replacing the previous hardcoded "30,000,000 /
  // 100,000,000" — reusing the same fetchHonorRanking endpoint
  // HonorRankingScreen already uses. Relabeled "This Week" rather than
  // "4-Day", since the backend only supports 'today' or 'week' periods
  // — there's no real 4-day window to report, so the label says what
  // the data actually is instead of what the original design implied.
  const todayRankingQuery = useQuery({ queryKey: ['gifts', 'ranking', 'today'], queryFn: () => fetchHonorRanking('today') });
  const weekRankingQuery = useQuery({ queryKey: ['gifts', 'ranking', 'week'], queryFn: () => fetchHonorRanking('week') });
  const todayTop = todayRankingQuery.data?.[0]?.honorScore ?? 0;
  const weekTop = weekRankingQuery.data?.[0]?.honorScore ?? 0;

  const createMutation = useMutation({
    mutationFn: () =>
      createRoom({
        title: title.trim() || 'Party Room',
        // Always send a real value (an empty one used to reach the database and fail).
        privacy: 'PUBLIC',
        seatCount,
        category: category ?? undefined,
        themeColor: route.params?.initialThemeColor,
        mode: mode === 'video' ? 'VIDEO' : 'AUDIO',
      }),
    onSuccess: (room) => {
      navigation.replace('Room', {
        roomId: room.id,
        initialVideoEnabled: mode === 'video',
      });
    },
    onError: (err: any) => {
      Alert.alert('Could not start party', describeApiError(err, 'Something went wrong'));
    },
  });

  const renderSeatPreview = (cols: number, rows: number, active: boolean) => (
    <View style={styles.previewGrid}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={styles.previewRow}>
          {Array.from({ length: cols }).map((__, c) => (
            <View
              key={c}
              style={[
                styles.previewCell,
                { backgroundColor: active ? '#8B5CF6' : 'rgba(255,255,255,0.35)' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      {mode === 'video' && <AgoraVideoView uid={0} style={StyleSheet.absoluteFill} />}
      <View
        style={[
          StyleSheet.absoluteFill,
          mode === 'voice' && styles.voiceBackdrop,
        ]}
      />

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.iconCircle}
        >
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconCircle} onPress={switchCamera}>
          <Ionicons name="camera-reverse-outline" size={20} color="#FFF" />
        </Pressable>
        <Pressable style={styles.iconCircle} onPress={() => setIsToolsSheetOpen(true)}>
          <Ionicons name="camera-outline" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* ── TITLE + CATEGORY ROW ────────────────────────── */}
      <View style={styles.titleRow}>
        <View style={styles.titleAvatarWrap}>
          <View style={styles.titleAvatar} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleInputWrap}>
            <TextInput
              style={styles.titleInput}
              placeholder="Please enter the content"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={title}
              onChangeText={setTitle}
              maxLength={40}
            />
            <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.6)" />
          </View>
          <View style={styles.categoryRow}>
            {ROOM_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(category === c ? null : c)}
                style={[
                  styles.categoryPill,
                  category === c && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === c && styles.categoryTextActive,
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* ── LUCKY GIFT RANKING BANNER ───────────────────── */}
      <LinearGradient
        colors={['#8B6B3D', '#5A4525']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rankingBanner}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.rankingTitle}>Gift Ranking</Text>
          <Text style={styles.rankingSub}>
            Today: ● {todayTop.toLocaleString()} / This Week: ● {weekTop.toLocaleString()}
          </Text>
        </View>
        <Ionicons name="trophy" size={26} color="#FFD34E" />
      </LinearGradient>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={{ flex: 1 }} />

      {/* ── BOTTOM SHEET ────────────────────────────────── */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + spacing.md }]}>
        {/* Video / Voice toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
            onPress={() => setMode('video')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'video' && styles.modeButtonTextActive,
              ]}
            >
              Video
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === 'voice' && styles.modeButtonActive]}
            onPress={() => setMode('voice')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'voice' && styles.modeButtonTextActive,
              ]}
            >
              Voice
            </Text>
          </Pressable>
        </View>

        {/* Seat layout picker */}
        <View style={styles.seatRow}>
          {SEAT_OPTIONS.map(({ count, cols, rows }) => {
            const active = seatCount === count;
            return (
              <Pressable
                key={count}
                style={[styles.seatOption, active && styles.seatOptionActive]}
                onPress={() => setSeatCount(count)}
              >
                {renderSeatPreview(cols, rows, active)}
              </Pressable>
            );
          })}
        </View>

        {/* CTA row */}
        <View style={styles.ctaRow}>
          <Pressable
            style={styles.sparkleButton}
            onPress={() => setIsToolsSheetOpen(true)}
          >
            <Ionicons name="sparkles" size={22} color="#FFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <GradientButton
              label={createMutation.isPending ? 'Starting...' : 'Hold a party'}
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
            />
          </View>
          <Pressable style={styles.sparkleButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <LiveToolsSheet
        visible={isToolsSheetOpen}
        onClose={() => setIsToolsSheetOpen(false)}
        isHost
        sessionTitle={title || 'Party Room'}
        switchCamera={switchCamera}
        isNoiseSuppressionOn={isNoiseSuppressionOn}
        toggleNoiseSuppression={toggleNoiseSuppression}
        isMicMuted={isMicMuted}
        toggleMic={toggleMic}
        beauty={beauty}
        setBeauty={setBeauty}
        background={background}
        setBackground={setBackground}
        faceShape={faceShape}
        setFaceShape={setFaceShape}
        initialPanel="beauty"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  voiceBackdrop: { backgroundColor: '#F6F8FC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  titleAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  titleInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  titleInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    paddingVertical: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#FFF' },

  rankingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  rankingTitle: { color: '#FFD34E', fontSize: 13, fontWeight: '900' },
  rankingSub: { color: '#E5D5B8', fontSize: 10, fontWeight: '700', marginTop: 2 },

  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(245,73,91,0.85)',
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  errorText: { color: '#FFF', fontSize: 12 },

  bottomSheet: {
    backgroundColor: 'rgba(10,6,24,0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
  },
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.pill,
    padding: 3,
    marginBottom: spacing.md,
  },
  modeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  modeButtonActive: { backgroundColor: colors.primary },
  modeButtonText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 14 },
  modeButtonTextActive: { color: '#FFF' },

  seatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  seatOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56,
  },
  seatOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(123,77,255,0.15)',
  },
  previewGrid: {
    alignItems: 'center',
    gap: 2,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 2,
  },
  previewCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sparkleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});