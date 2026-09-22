import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radii, spacing, type } from '../theme';
import { BeautyFilterSheet, type BeautyOptions } from '../components/BeautyFilterSheet';

export const ROOM_CATEGORIES = [
  'Chill & Chat',
  'Sing & Karaoke',
  'Gaming Lounge',
  'Late Night Radio',
  'Dating & Match',
  'Music Beats',
  'Language Exchange',
];

const SEAT_PREVIEWS = [
  { count: 4, label: '4 Seats (2×2)' },
  { count: 6, label: '6 Seats (3×2)' },
  { count: 8, label: '8 Seats (4×2)' },
  { count: 9, label: '9 Seats (3×3 King)' },
  { count: 12, label: '12 Seats (4×3)' },
];

export interface RoomCreationConfig {
  title: string;
  category: string;
  seatCount: number;
  mode: 'video' | 'voice';
  privacy: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  isCameraEnabled: boolean;
  beauty: BeautyOptions;
}

interface PreRoomScreenProps {
  initialMode?: 'video' | 'voice';
  onStartRoom?: (roomConfig: RoomCreationConfig) => void;
  onGoBack?: () => void;
}

export function PreRoomScreen({
  initialMode = 'video',
  onStartRoom,
  onGoBack,
}: PreRoomScreenProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'video' | 'voice'>(initialMode);
  const [title, setTitle] = useState(
    initialMode === 'video' ? 'Late Night Video Hangout 📹' : 'Chill Voice Lounge & Lo-Fi 🌙'
  );
  const [category, setCategory] = useState(initialMode === 'video' ? 'Chill & Chat' : 'Music Beats');
  const [seatCount, setSeatCount] = useState<number>(8);
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'>('PUBLIC');
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');

  // Beauty Filters state
  const [isBeautyOpen, setIsBeautyOpen] = useState(false);
  const [beauty, setBeauty] = useState<BeautyOptions>({
    enabled: true,
    smoothnessLevel: 0.5,
    lighteningLevel: 0.25,
    rednessLevel: 0.2,
    chinSlimming: 30,
    eyeEnlarge: 20,
    virtualBackgroundBlur: false,
  });

  const handleStart = () => {
    onStartRoom?.({
      title: title.trim() || (mode === 'video' ? 'Video Party Room' : 'Audio Party Room'),
      category,
      seatCount,
      mode,
      privacy,
      isCameraEnabled: mode === 'video' ? isCameraEnabled : false,
      beauty,
    });
  };

  const handleSwitchCamera = () => {
    setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2A1856', '#140A2C', '#0A0517']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onGoBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Start Party Room</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ROOM MODE SELECTOR: VIDEO PARTY VS AUDIO PARTY */}
        <View style={styles.modeCard}>
          <Text style={styles.sectionLabel}>Select Party Mode</Text>
          <View style={styles.modeToggleRow}>
            {/* Video Party Button */}
            <Pressable
              style={[
                styles.modeButton,
                mode === 'video' && styles.modeButtonActive,
              ]}
              onPress={() => {
                setMode('video');
                setTitle('Late Night Video Hangout 📹');
              }}
            >
              <Ionicons
                name="videocam"
                size={18}
                color={mode === 'video' ? '#FFF' : colors.primaryLight}
              />
              <View style={styles.modeBtnTextWrap}>
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'video' && styles.modeButtonTextActive,
                  ]}
                >
                  Video Party
                </Text>
                <Text style={styles.modeButtonSub}>Multi-Camera + Beauty</Text>
              </View>
            </Pressable>

            {/* Audio Party Button */}
            <Pressable
              style={[
                styles.modeButton,
                mode === 'voice' && styles.modeButtonActive,
              ]}
              onPress={() => {
                setMode('voice');
                setTitle('Chill Voice Lounge & Lo-Fi 🌙');
              }}
            >
              <Ionicons
                name="mic"
                size={18}
                color={mode === 'voice' ? '#FFF' : colors.primaryLight}
              />
              <View style={styles.modeBtnTextWrap}>
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'voice' && styles.modeButtonTextActive,
                  ]}
                >
                  Audio Party
                </Text>
                <Text style={styles.modeButtonSub}>Voice Lounge + Sofa</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* CAMERA PREVIEW & BEAUTY (If Video Party mode) */}
        {mode === 'video' && (
          <View style={styles.cameraPreviewCard}>
            <View style={styles.cameraSurface}>
              <LinearGradient
                colors={['#3B246C', '#1B0E38', '#0D061C']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cameraPlaceholder}>
                <Ionicons
                  name={isCameraEnabled ? 'person-circle-outline' : 'videocam-off-outline'}
                  size={56}
                  color={isCameraEnabled ? colors.primaryLight : colors.danger}
                />
                <Text style={styles.cameraStatusText}>
                  {isCameraEnabled
                    ? `Live Camera Preview (${cameraFacing === 'front' ? 'Front' : 'Back'})`
                    : 'Camera is Turned Off'}
                </Text>
                {beauty.enabled && (
                  <View style={styles.beautyBadge}>
                    <Ionicons name="sparkles" size={10} color="#FFD166" />
                    <Text style={styles.beautyBadgeText}>AI Beauty Retouch On</Text>
                  </View>
                )}
              </View>

              {/* Camera Overlays */}
              <View style={styles.cameraActionOverlay}>
                <Pressable
                  style={styles.camIconBtn}
                  onPress={() => setIsCameraEnabled(!isCameraEnabled)}
                >
                  <Ionicons
                    name={isCameraEnabled ? 'videocam' : 'videocam-off'}
                    size={16}
                    color="#FFF"
                  />
                </Pressable>

                <Pressable style={styles.camIconBtn} onPress={handleSwitchCamera}>
                  <Ionicons name="camera-reverse" size={16} color="#FFF" />
                </Pressable>

                <Pressable
                  style={[styles.camIconBtn, styles.beautyBtnActive]}
                  onPress={() => setIsBeautyOpen(true)}
                >
                  <Ionicons name="sparkles" size={16} color="#FFD166" />
                  <Text style={styles.beautyBtnText}>Beauty</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Room Title Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Room Topic & Title</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your party a catchy title"
              placeholderTextColor="rgba(255,255,255,0.35)"
            />
            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Party Category</Text>
          <View style={styles.categoryWrap}>
            {ROOM_CATEGORIES.map((cat) => {
              const isActive = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Seat Count Picker */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Seat Capacity Layout</Text>
          <View style={styles.seatGrid}>
            {SEAT_PREVIEWS.map((item) => {
              const isSelected = seatCount === item.count;
              return (
                <Pressable
                  key={item.count}
                  style={[styles.seatCard, isSelected && styles.seatCardActive]}
                  onPress={() => setSeatCount(item.count)}
                >
                  <Ionicons
                    name={mode === 'video' ? 'videocam-outline' : 'people-outline'}
                    size={20}
                    color={isSelected ? colors.primaryLight : colors.textSecondary}
                  />
                  <Text style={[styles.seatCountText, isSelected && styles.seatCountTextActive]}>
                    {item.count} Seats
                  </Text>
                  <Text style={styles.seatSub}>{item.label.split(' ')[1]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Room Privacy */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Room Privacy</Text>
          <View style={styles.privacyRow}>
            {[
              { id: 'PUBLIC', label: 'Public Party', icon: 'globe-outline' },
              { id: 'FOLLOWERS_ONLY', label: 'Followers Only', icon: 'people-outline' },
              { id: 'PRIVATE', label: 'Password / Invite', icon: 'lock-closed-outline' },
            ].map((p) => {
              const isSelected = privacy === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.privacyPill, isSelected && styles.privacyPillActive]}
                  onPress={() => setPrivacy(p.id as any)}
                >
                  <Ionicons
                    name={p.icon as any}
                    size={14}
                    color={isSelected ? '#FFF' : colors.textSecondary}
                  />
                  <Text style={[styles.privacyText, isSelected && styles.privacyTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Audio Optimizations */}
        <View style={styles.card}>
          <View style={styles.featureRow}>
            <View>
              <Text style={styles.featureTitle}>AI Noise Suppression (Agora 3A)</Text>
              <Text style={styles.featureSub}>Acoustic echo and background noise cancellation</Text>
            </View>
            <Pressable
              style={[
                styles.togglePill,
                noiseSuppression && { backgroundColor: colors.primary },
              ]}
              onPress={() => setNoiseSuppression(!noiseSuppression)}
            >
              <Text style={styles.toggleText}>{noiseSuppression ? 'ON' : 'OFF'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Launch CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.launchBtn} onPress={handleStart}>
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.launchGradient}
          >
            <Ionicons
              name={mode === 'video' ? 'videocam' : 'radio'}
              size={18}
              color="#FFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.launchText}>
              Go Now
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Beauty Filter Sheet */}
      <BeautyFilterSheet
        visible={isBeautyOpen}
        onClose={() => setIsBeautyOpen(false)}
        beauty={beauty}
        onChangeBeauty={(next) => setBeauty((prev) => ({ ...prev, ...next }))}
        onSwitchCamera={handleSwitchCamera}
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 110,
  },
  modeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  modeBtnTextWrap: {
    flex: 1,
  },
  modeButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  modeButtonSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    marginTop: 1,
  },
  cameraPreviewCard: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 255, 0.3)',
  },
  cameraSurface: {
    height: 160,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cameraStatusText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  beautyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.4)',
  },
  beautyBadgeText: {
    color: '#FFD166',
    fontSize: 9,
    fontWeight: '800',
  },
  cameraActionOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  camIconBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beautyBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(138, 79, 255, 0.5)',
    borderColor: colors.primaryLight,
  },
  beautyBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    paddingVertical: 8,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs * 1.5,
    justifyContent: 'space-between',
  },
  seatCard: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  seatCardActive: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
  },
  seatCountText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  seatCountTextActive: {
    color: '#FFF',
  },
  seatSub: {
    color: colors.textMuted,
    fontSize: 10,
  },
  privacyRow: {
    gap: spacing.xs,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  privacyPillActive: {
    backgroundColor: 'rgba(138, 79, 255, 0.18)',
    borderColor: colors.primaryLight,
  },
  privacyText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  privacyTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  featureSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  togglePill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  toggleText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(14, 8, 31, 0.95)',
    paddingTop: 10,
  },
  launchBtn: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  launchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  launchText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
