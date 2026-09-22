import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Share,
  useWindowDimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, type, gradients } from '../theme';
import type { FaceShapeState } from '../live/useAgoraEngine';

export interface BeautyState {
  enabled: boolean;
  lighteningContrastLevel: number;
  lighteningLevel: number;
  smoothnessLevel: number;
  rednessLevel: number;
}

export type BackgroundMode = 'none' | 'blur' | 'color' | 'image';

export interface BackgroundState {
  mode: BackgroundMode;
  color?: string;
  imagePath?: string;
  blurDegree: 'small' | 'large';
}

type ToolItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  bg: string;
  badge?: string;
  gradient?: readonly [string, string, ...string[]];
  onPress?: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  isHost: boolean;
  sessionTitle: string;

  switchCamera?: () => void;
  isNoiseSuppressionOn?: boolean;
  toggleNoiseSuppression?: () => void;
  isMicMuted?: boolean;
  toggleMic?: () => void;

  filter?: string;
  onFilterChange?: (f: string) => void;
  filters?: string[];

  beauty?: BeautyState;
  setBeauty?: (next: Partial<BeautyState>) => void;
  background?: BackgroundState;
  setBackground?: (next: Partial<BackgroundState>) => void;
  faceShape?: FaceShapeState;
  setFaceShape?: (next: Partial<FaceShapeState>) => void;
  // Lets a caller (the pre-broadcast preview screen's sparkle icon) jump
  // straight to the beauty panel instead of the main grid — optional and
  // defaults to 'main', so every existing call site is unaffected.
  initialPanel?: 'main' | 'beauty';

  // Extra real actions a screen can offer. A tile only appears when its handler
  // (or, for share, its message) is provided — there are no placeholder tiles.
  onOpenPk?: () => void;
  roomMode?: 'VIDEO' | 'AUDIO';
  onToggleRoomMode?: () => void;
  shareMessage?: string;
};

const BEAUTY_PRESETS: { name: string; value: Partial<BeautyState> }[] = [
  { name: 'Natural',   value: { lighteningLevel: 0.3,  smoothnessLevel: 0.25, rednessLevel: 0.05, lighteningContrastLevel: 1 } },
  { name: 'Soft Glow', value: { lighteningLevel: 0.6,  smoothnessLevel: 0.55, rednessLevel: 0.15, lighteningContrastLevel: 1 } },
  { name: 'Bright',    value: { lighteningLevel: 0.85, smoothnessLevel: 0.4,  rednessLevel: 0.1,  lighteningContrastLevel: 2 } },
  { name: 'Rosy',      value: { lighteningLevel: 0.5,  smoothnessLevel: 0.6,  rednessLevel: 0.4,  lighteningContrastLevel: 1 } },
];

type BeautyCategoryKey = 'whitening' | 'smoothing' | 'rosy' | 'eyes' | 'nose' | 'chin' | 'forehead' | 'lip';

// One shared slider drives whichever of these is selected — matches the
// reference's exact interaction. min/max match each field's real,
// documented range (see useAgoraEngine's FaceShapeState comments for the
// face-shape ones specifically; skin fields are all [0,1] except contrast
// which stays as its own separate control since it's a 3-way choice, not
// a slider).
const BEAUTY_CATEGORIES: {
  key: BeautyCategoryKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  group: 'skin' | 'face';
  beautyField?: keyof BeautyState;
  faceShapeField?: keyof FaceShapeState;
  min: number;
  max: number;
}[] = [
  { key: 'whitening', label: 'Whitening', icon: 'sunny-outline',        group: 'skin', beautyField: 'lighteningLevel', min: 0, max: 1 },
  { key: 'smoothing', label: 'Smoothing', icon: 'water-outline',        group: 'skin', beautyField: 'smoothnessLevel', min: 0, max: 1 },
  { key: 'rosy',      label: 'Rosy',      icon: 'heart-outline',        group: 'skin', beautyField: 'rednessLevel',    min: 0, max: 1 },
  { key: 'eyes',      label: 'Eyes',      icon: 'eye-outline',          group: 'face', faceShapeField: 'eyes',     min: 0,    max: 100 },
  { key: 'nose',      label: 'Nose',      icon: 'ellipse-outline',      group: 'face', faceShapeField: 'nose',     min: -100, max: 100 },
  { key: 'chin',      label: 'Chin',      icon: 'contract-outline',     group: 'face', faceShapeField: 'chin',     min: -100, max: 100 },
  { key: 'forehead',  label: 'Forehead',  icon: 'body-outline',         group: 'face', faceShapeField: 'forehead', min: 0,    max: 100 },
  { key: 'lip',       label: 'Lip',       icon: 'happy-outline',        group: 'face', faceShapeField: 'lip',      min: 0,    max: 100 },
];

const BACKGROUND_COLORS = ['#1E1E2E', '#0E0A1F', '#2D1B4E', '#1A3A2E', '#3E1F1F', '#1E2A44'];

// Looks built from Agora's real skin settings (whitening, smoothing, rosy tone,
// contrast). "None" switches beauty off.
const SKIN_FILTERS: { name: string; value: Omit<BeautyState, 'enabled'> | null }[] = [
  { name: 'None', value: null },
  { name: 'Natural', value: { lighteningContrastLevel: 1, lighteningLevel: 0.2, smoothnessLevel: 0.3, rednessLevel: 0.1 } },
  { name: 'Fair', value: { lighteningContrastLevel: 1, lighteningLevel: 0.7, smoothnessLevel: 0.4, rednessLevel: 0.1 } },
  { name: 'Rosy', value: { lighteningContrastLevel: 1, lighteningLevel: 0.3, smoothnessLevel: 0.4, rednessLevel: 0.7 } },
  { name: 'Glow', value: { lighteningContrastLevel: 2, lighteningLevel: 0.5, smoothnessLevel: 0.5, rednessLevel: 0.4 } },
  { name: 'Crisp', value: { lighteningContrastLevel: 2, lighteningLevel: 0.2, smoothnessLevel: 0.1, rednessLevel: 0 } },
  { name: 'Soft', value: { lighteningContrastLevel: 0, lighteningLevel: 0.4, smoothnessLevel: 0.9, rednessLevel: 0.2 } },
];
const sameLook = (a: BeautyState, b: Omit<BeautyState, 'enabled'>) =>
  a.lighteningContrastLevel === b.lighteningContrastLevel && a.lighteningLevel === b.lighteningLevel && a.smoothnessLevel === b.smoothnessLevel && a.rednessLevel === b.rednessLevel;

export function LiveToolsSheet({
  visible,
  onClose,
  isHost,
  sessionTitle,
  switchCamera,
  isNoiseSuppressionOn,
  toggleNoiseSuppression,
  isMicMuted,
  toggleMic,
  filter,
  onFilterChange,
  filters,
  beauty,
  setBeauty,
  background,
  setBackground,
  faceShape,
  setFaceShape,
  onOpenPk,
  roomMode,
  onToggleRoomMode,
  shareMessage,
  initialPanel,
}: Props) {
  const [panel, setPanel] = useState<'main' | 'beauty'>(initialPanel ?? 'main');

  useEffect(() => {
    if (visible) setPanel(initialPanel ?? 'main');
  }, [visible, initialPanel]);

  // Every tile below does something real. This sheet used to list ~25 more
  // (Admins, Text Bubble, Fan Club, Live Data, Live Management, Ambient Sound,
  // Screen recording, Live Stream Insight, Message, Mirror, Effect & Msg, Rank,
  // Rewards, Store, VIP, Gift Center, Bag, Gift Gallery, Lucky Box, Gift
  // Collection, Gift Wish, ...) that were not wired to anything.
  const tools: ToolItem[] = [];
  if (isHost && onToggleRoomMode && roomMode) {
    const toVideo = roomMode === 'AUDIO';
    tools.push({
      key: 'roomMode',
      label: toVideo ? 'Switch to Video' : 'Switch to Audio',
      icon: toVideo ? 'videocam-outline' : 'mic-outline',
      tint: '#FFF',
      bg: 'rgba(255,255,255,0.10)',
      onPress: onToggleRoomMode,
    });
  }
  if (switchCamera) {
    tools.push({ key: 'switchCamera', label: 'Switch Camera', icon: 'camera-reverse-outline', tint: '#FFF', bg: 'rgba(255,255,255,0.10)', onPress: switchCamera });
  }
  if (toggleMic) {
    tools.push({
      key: 'mic',
      label: isMicMuted ? 'Muted' : 'Mic On',
      icon: isMicMuted ? 'mic-off-outline' : 'mic-outline',
      tint: isMicMuted ? '#FF4D67' : '#FFF',
      bg: isMicMuted ? 'rgba(255,77,103,0.25)' : 'rgba(255,255,255,0.10)',
      onPress: toggleMic,
    });
  }
  if (beauty && setBeauty && faceShape && setFaceShape && background && setBackground) {
    tools.push({
      key: 'beauty',
      label: 'Beauty',
      icon: 'sparkles-outline',
      tint: beauty.enabled ? '#FFD700' : '#FFF',
      bg: beauty.enabled ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.10)',
      onPress: () => setPanel('beauty'),
    });
  }
  if (toggleNoiseSuppression) {
    tools.push({
      key: 'noise',
      label: 'Noise Reduction',
      icon: 'pulse-outline',
      tint: isNoiseSuppressionOn ? '#6B4EFF' : '#FFF',
      bg: isNoiseSuppressionOn ? 'rgba(107,78,255,0.25)' : 'rgba(255,255,255,0.10)',
      badge: isNoiseSuppressionOn ? 'On' : undefined,
      onPress: toggleNoiseSuppression,
    });
  }
  if (onOpenPk) {
    tools.push({ key: 'pk', label: 'PK Battle', icon: 'flash-outline', tint: '#FFC24B', bg: 'rgba(255,194,75,0.18)', onPress: () => { onClose(); onOpenPk(); } });
  }
  if (shareMessage) {
    tools.push({
      key: 'share',
      label: 'Share',
      icon: 'arrow-redo-outline',
      tint: '#FFF',
      bg: 'rgba(255,255,255,0.10)',
      onPress: () => {
        Share.share({ message: shareMessage }).catch(() => {});
      },
    });
  }

  const renderTool = (t: ToolItem) => (
    <Pressable key={t.key} style={styles.toolCell} onPress={t.onPress}>
      <View style={styles.toolIconWrap}>
        {t.gradient ? (
          <LinearGradient
            colors={t.gradient}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.toolIcon}
          >
            <Ionicons name={t.icon} size={22} color={t.tint} />
          </LinearGradient>
        ) : (
          <View style={[styles.toolIcon, { backgroundColor: t.bg }]}>
            <Ionicons name={t.icon} size={22} color={t.tint} />
          </View>
        )}
        {t.badge && (
          <View style={styles.toolBadge}>
            <Text style={styles.toolBadgeText}>{t.badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.toolLabel} numberOfLines={1}>{t.label}</Text>
    </Pressable>
  );

  const [beautyTab, setBeautyTab] = useState<'preset' | 'beauty' | 'filters' | 'bg'>('preset');
  const [selectedCategory, setSelectedCategory] = useState<BeautyCategoryKey>('whitening');

  // Real device photo picker — replaces the earlier "coming soon"
  // placeholder. Requests media-library permission first since
  // launchImageLibraryAsync silently returns nothing useful without it
  // on some Android versions. Uses the current (non-deprecated) mediaTypes
  // array form — Expo's own docs mark the older MediaTypeOptions enum as
  // deprecated as of recent SDKs.
  const pickBackgroundImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setBackground?.({ mode: 'image', imagePath: result.assets[0].uri });
    }
  };

  const renderBeautyPanel = () => {
    if (!beauty || !setBeauty || !background || !setBackground || !faceShape || !setFaceShape) {
      return (
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <Text style={styles.emptyText}>Beauty is unavailable in this build.</Text>
        </View>
      );
    }

    const category = BEAUTY_CATEGORIES.find((c) => c.key === selectedCategory)!;
    const currentValue =
      category.group === 'skin' ? (beauty[category.beautyField!] as number) : (faceShape[category.faceShapeField!] as number);

    const handleSliderChange = (raw: number) => {
      if (category.group === 'skin') {
        setBeauty({ enabled: true, [category.beautyField!]: raw } as Partial<BeautyState>);
      } else {
        setFaceShape({ enabled: true, [category.faceShapeField!]: raw } as Partial<FaceShapeState>);
      }
    };

    return (
      <View>
        {/* Tab bar — Preset / Beauty / Sticker / Filters, matching the
            reference exactly, plus Background as a 5th tab since it's a
            real, already-working feature with nowhere else to live
            rather than something to drop. */}
        <View style={styles.tabBar}>
          {(
            [
              ['preset', 'Preset'],
              ['beauty', 'Beauty'],
              ['filters', 'Filters'],
              ['bg', 'BG'],
            ] as const
          )
            .map(([key, label]) => (
            <Pressable key={key} onPress={() => setBeautyTab(key)} style={styles.tabItem}>
              <Text style={[styles.tabText, beautyTab === key && styles.tabTextActive]}>{label}</Text>
              {beautyTab === key && <View style={styles.tabUnderline} />}
            </Pressable>
          ))}
          <Pressable
            style={styles.tabResetBtn}
            onPress={() => {
              setBeauty({ enabled: false, lighteningLevel: 0.7, smoothnessLevel: 0.5, rednessLevel: 0.1, lighteningContrastLevel: 1 });
              setFaceShape({ enabled: false, eyes: 50, nose: 50, chin: 0, forehead: 0, lip: 0 });
            }}
          >
            <Ionicons name="refresh-outline" size={14} color="#FFF" />
            <Text style={styles.tabResetText}>Reset</Text>
          </Pressable>
        </View>

        {beautyTab === 'preset' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            {BEAUTY_PRESETS.map((p) => (
              <Pressable key={p.name} onPress={() => setBeauty({ ...p.value, enabled: true })} style={styles.presetChip}>
                <Text style={styles.presetChipText}>{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {beautyTab === 'beauty' && (
          <>
            {/* One shared slider driven by whichever category icon is
                selected below — matches the reference's exact
                interaction (tap Lip, one slider appears, drag it). Skin
                categories (Whitening/Smoothing/Rosy) write to
                setBeautyEffectOptions; face categories (Eyes/Nose/Chin/
                Forehead/Lip) write to setFaceShapeAreaOptions — a
                genuinely different Agora API, real and verified against
                the SDK's own type definitions, but marked by Agora's own
                docs as a value-added service that may need separate
                enabling on your Agora Console account before it does
                anything visible, regardless of this wiring being correct. */}
            <View style={styles.sliderRow}>
              <Slider
                style={styles.slider}
                minimumValue={category.min}
                maximumValue={category.max}
                value={currentValue}
                onValueChange={handleSliderChange}
                minimumTrackTintColor="#E23A6E"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#E23A6E"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {BEAUTY_CATEGORIES.map((c) => (
                <Pressable key={c.key} onPress={() => setSelectedCategory(c.key)} style={styles.categoryItem}>
                  <View style={[styles.categoryIcon, selectedCategory === c.key && styles.categoryIconActive]}>
                    <Ionicons name={c.icon} size={20} color={selectedCategory === c.key ? '#E23A6E' : '#FFF'} />
                  </View>
                  <Text style={[styles.categoryLabel, selectedCategory === c.key && styles.categoryLabelActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {beautyTab === 'filters' && (
          <>
            {/* Real filters: each is a look built from the SDK's skin settings
                (brightness, contrast, smoothing, warmth), applied to what viewers
                see — not a tint drawn over the host's own screen. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {SKIN_FILTERS.map((f) => {
                const active = f.value ? beauty.enabled && sameLook(beauty, f.value) : !beauty.enabled;
                return (
                  <Pressable
                    key={f.name}
                    onPress={() => setBeauty(f.value ? { ...f.value, enabled: true } : { ...beauty, enabled: false })}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    {active && <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.emptyText}>Filters change brightness, contrast, smoothing and warmth. Fine-tune them in the Beauty tab.</Text>
          </>
        )}

        {beautyTab === 'bg' && (
          <>
            <View style={styles.bgRow}>
              {(['none', 'blur', 'color', 'image'] as BackgroundMode[]).map((m) => {
                const active = background.mode === m;
                const label = m === 'none' ? 'None' : m === 'blur' ? 'Blur' : m === 'color' ? 'Color' : 'Image';
                const icon: React.ComponentProps<typeof Ionicons>['name'] =
                  m === 'none' ? 'close-circle-outline' : m === 'blur' ? 'water-outline' : m === 'color' ? 'color-palette-outline' : 'image-outline';
                return (
                  <Pressable key={m} onPress={() => setBackground({ mode: m })} style={[styles.bgChip, active && styles.bgChipActive]}>
                    <Ionicons name={icon} size={18} color={active ? '#FFF' : 'rgba(255,255,255,0.7)'} />
                    <Text style={[styles.bgChipText, active && styles.bgChipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {background.mode === 'blur' && (
              <View style={styles.subRow}>
                {(['small', 'large'] as const).map((d) => {
                  const active = background.blurDegree === d;
                  return (
                    <Pressable key={d} onPress={() => setBackground({ blurDegree: d })} style={[styles.subChip, active && styles.subChipActive]}>
                      <Text style={[styles.subChipText, active && styles.subChipTextActive]}>{d === 'small' ? 'Light blur' : 'Heavy blur'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {background.mode === 'color' && (
              <View style={styles.colorGrid}>
                {BACKGROUND_COLORS.map((c) => {
                  const active = background.color === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setBackground({ color: c })}
                      style={[styles.colorSwatch, { backgroundColor: c }, active && styles.colorSwatchActive]}
                    />
                  );
                })}
              </View>
            )}

            {background.mode === 'image' && (
              <View style={styles.imageRow}>
                {background.imagePath ? (
                  <Image source={{ uri: background.imagePath }} style={styles.imagePreview} />
                ) : (
                  <View style={[styles.imagePreview, styles.imagePreviewEmpty]}>
                    <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
                <Pressable style={styles.imagePickBtn} onPress={pickBackgroundImage}>
                  <Ionicons name="images-outline" size={16} color="#FFF" />
                  <Text style={styles.imagePickBtnText}>{background.imagePath ? 'Change photo' : 'Choose photo'}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  if (!visible) return null;

  return (
    // Plain in-screen overlay instead of RN's <Modal> — Modals render in
    // a separate native Window on Android, and the camera preview behind
    // this sheet is an Agora RtcSurfaceView (a real Android SurfaceView),
    // which has a well-known class of rendering bugs when covered by a
    // different Window: the surface can fail to properly resume once
    // uncovered, which is almost certainly what was causing the camera
    // to go blank after closing this sheet. A same-tree absolutely-
    // positioned overlay avoids that Window boundary entirely, and as a
    // second real benefit, lets the sheet only cover part of the screen
    // (see sheet's height below) so the live preview stays visible above
    // it — matching the reference's "see the effect in real time" request,
    // which the previous 85%-tall version made impossible either way.
    // zIndex + elevation: the chat overlay and other in-screen layers used to draw
    // OVER this sheet (Android orders by elevation, not just tree order), which hid
    // part of it. The sheet's height is a share of the screen with room for the
    // phone's own buttons, and its content scrolls, so every tool can be reached.
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]} pointerEvents="box-none">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { maxHeight: Math.round(windowHeight * 0.62), paddingBottom: insets.bottom + spacing.md }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabber} />

          {panel === 'beauty' && (
            <Pressable style={styles.backRow} onPress={() => setPanel('main')}>
              <Ionicons name="chevron-back" size={20} color="#FFF" />
              <Text style={styles.backText}>Beauty</Text>
            </Pressable>
          )}

          {panel === 'main' && (
            <ScrollView
              style={{ flexGrow: 0 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
            >
              <Text style={styles.sectionTitle}>{isHost ? 'Studio Tools' : 'Tools'}</Text>
              {tools.length > 0 ? (
                <View style={styles.grid}>{tools.map(renderTool)}</View>
              ) : (
                <Text style={styles.emptyText}>No tools are available here.</Text>
              )}

              {filters && onFilterChange && (
                <>
                  <Text style={styles.sectionTitle}>Color Filter</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {filters.map((f) => {
                      const active = filter === f;
                      return (
                        <Pressable key={f} onPress={() => onFilterChange(f)} style={[styles.filterChip, active && styles.filterChipActive]}>
                          {active && <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </ScrollView>
          )}

          {panel === 'beauty' && renderBeautyPanel()}
        </Pressable>
      </Pressable>
    </View>
  );
}

function BeautySlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.labeledSliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <Slider
        style={styles.labeledSlider}
        minimumValue={0}
        maximumValue={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#6B4EFF"
        maximumTrackTintColor="rgba(255,255,255,0.15)"
        thumbTintColor="#FFF"
      />
      <Text style={styles.sliderValue}>{Math.round(value * 100)}</Text>
    </View>
  );
}

const COLUMNS = 4;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0E0A1F',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  toolCell: { width: `${100 / COLUMNS}%`, alignItems: 'center' },
  toolIconWrap: { position: 'relative', marginBottom: 6 },
  toolIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toolBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0E0A1F',
  },
  toolBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  toolLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, textAlign: 'center', paddingHorizontal: 2 },
  filterRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipActive: { borderColor: '#B06AB3' },
  filterChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF', fontWeight: '800' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: spacing.sm },
  backText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 2,
    marginBottom: spacing.xs,
  },
  tabItem: { paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#FFF', fontWeight: '800' },
  tabUnderline: { height: 2, width: 16, backgroundColor: '#E23A6E', borderRadius: 1, marginTop: 3 },
  tabResetBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto', paddingHorizontal: 6 },
  tabResetText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  sliderRow: { paddingHorizontal: spacing.xs, paddingTop: 2 },
  slider: { width: '100%', height: 32 },
  categoryRow: { gap: spacing.md, paddingVertical: spacing.xs, alignItems: 'center' },
  categoryItem: { alignItems: 'center', gap: 4, width: 56 },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: { backgroundColor: 'rgba(226,58,110,0.2)', borderWidth: 1.5, borderColor: '#E23A6E' },
  categoryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  categoryLabelActive: { color: '#E23A6E', fontWeight: '800' },
  unavailableBox: { alignItems: 'center', gap: 6, paddingVertical: spacing.md },
  masterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  masterLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  presetRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(107,78,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(107,78,255,0.5)',
  },
  presetChipText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  labeledSliderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  sliderLabel: { color: 'rgba(255,255,255,0.85)', width: 80, fontSize: 13 },
  labeledSlider: { flex: 1, height: 40 },
  sliderValue: { color: '#FFF', width: 34, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  contrastRow: { flexDirection: 'row', gap: spacing.xs },
  contrastChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  contrastChipActive: { backgroundColor: '#6B4EFF' },
  contrastText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  contrastTextActive: { color: '#FFF', fontWeight: '800' },
  bgRow: { flexDirection: 'row', gap: spacing.xs },
  bgChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bgChipActive: { backgroundColor: '#6B4EFF', borderColor: '#B06AB3' },
  bgChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  bgChipTextActive: { color: '#FFF', fontWeight: '800' },
  subRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  subChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  subChipActive: { backgroundColor: '#6B4EFF' },
  subChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  subChipTextActive: { color: '#FFF', fontWeight: '800' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  colorSwatch: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  colorSwatchActive: { borderColor: '#FFF', borderWidth: 3 },
  imageHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(94,224,255,0.12)',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  imagePreview: { width: 44, height: 44, borderRadius: 8 },
  imagePreviewEmpty: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  imagePickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
  },
  imagePickBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  imageHintText: { color: '#5EE0FF', fontSize: 11, flex: 1 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resetText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});