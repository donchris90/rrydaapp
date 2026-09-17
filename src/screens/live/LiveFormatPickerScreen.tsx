import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

// Visual design matches a reference the user provided closely (dark
// card grid, colored icon + badge + title + subtitle per tile, cyan
// glow on the selected one, a theme-picker + guidelines + gradient
// confirm button once a format is chosen) — but every tile and the
// theme picker both route to something real. Two formats from that
// reference are deliberately NOT here: "PK Battle — auto-match 1v1"
// implied random-opponent matchmaking, which doesn't exist anywhere in
// this backend (the real PK flow is challenge-a-specific-friend);
// "Game Live — stream mobile games" implied screen-capture broadcasting,
// which also doesn't exist. PK routes to the real challenge screen with
// honest copy; Game Live isn't included at all.
type FormatKey = 'video' | 'party' | 'audio' | 'pk';

const FORMATS: {
  key: FormatKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  subtitle: string;
}[] = [
  {
    key: 'video',
    icon: 'videocam',
    iconColor: '#22D3EE',
    badge: 'Popular',
    badgeColor: 'rgba(255,255,255,0.15)',
    title: 'Video Live',
    subtitle: 'Broadcast camera with filters',
  },
  {
    key: 'pk',
    icon: 'flash',
    iconColor: colors.pink,
    badge: 'High Coin',
    badgeColor: 'rgba(255,61,138,0.25)',
    title: 'PK Battle',
    subtitle: 'Challenge a friend to a 1v1 clash',
  },
  {
    key: 'party',
    icon: 'radio',
    iconColor: '#22D3EE',
    badge: 'Social',
    badgeColor: 'rgba(255,255,255,0.15)',
    title: 'Party',
    subtitle: 'Multi-guest voice & video, pick your seat count',
  },
  {
    key: 'audio',
    icon: 'mic',
    iconColor: '#A78BFA',
    title: 'Audio Room',
    subtitle: 'Voice-only, no camera needed',
  },
];

// Real, persisted room accent — stored on LiveSession/PartyRoom's real
// themeColor field (added specifically for this), not just a cosmetic
// toggle on this setup screen. Hex values map directly to what the
// backend validates and stores.
const THEMES: { key: string; hex: string; name: string; subtitle: string }[] = [
  { key: 'neon-blue', hex: '#22D3EE', name: 'Neon Blue', subtitle: 'Electric Cyberpunk Cyan' },
  { key: 'royal-purple', hex: '#A78BFA', name: 'Royal Purple', subtitle: 'Regal Amethyst & Violet' },
  { key: 'sunset-orange', hex: '#FB923C', name: 'Sunset Orange', subtitle: 'Warm Golden Horizon' },
  { key: 'emerald-cyber', hex: '#2DD4BF', name: 'Emerald Cyber', subtitle: 'Matrix Neon Mint' },
];

export function LiveFormatPickerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [title, setTitle] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatKey | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].key);

  // PK Battle has no room to theme (it routes straight to the real
  // challenge screen, not a broadcast setup), so it skips the theme step
  // entirely rather than showing a picker that wouldn't do anything.
  const showThemeStep = selectedFormat === 'video' || selectedFormat === 'party' || selectedFormat === 'audio';

  const handleSelectFormat = (key: FormatKey) => {
    setSelectedFormat(key);
    if (key === 'pk') {
      navigation.navigate('PkScreen');
    }
  };

  const handleGoLive = () => {
    const themeHex = THEMES.find((t) => t.key === selectedTheme)?.hex;
    if (selectedFormat === 'video') {
      navigation.navigate('MainTabs', { screen: 'GoLive', params: { initialTitle: title, initialThemeColor: themeHex } });
    } else if (selectedFormat === 'party' || selectedFormat === 'audio') {
      navigation.navigate('PreRoom', { initialMode: selectedFormat === 'audio' ? 'voice' : 'video', initialThemeColor: themeHex });
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Choose your live room format</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>LIVE STREAM TITLE</Text>
        <View style={styles.titleInputWrap}>
          <Text style={styles.titleEmoji}>🔥</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Welcome to my live room! Let's vibe!"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>BROADCAST FORMAT</Text>
        <View style={styles.grid}>
          {FORMATS.map((f) => {
            const isSelected = selectedFormat === f.key;
            return (
              <Pressable key={f.key} style={[styles.tile, isSelected && styles.tileSelected]} onPress={() => handleSelectFormat(f.key)}>
                <View style={styles.tileTop}>
                  <Ionicons name={f.icon} size={22} color={f.iconColor} />
                  {f.badge && (
                    <View style={[styles.badge, { backgroundColor: f.badgeColor }]}>
                      <Text style={styles.badgeText}>{f.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tileTitle}>{f.title}</Text>
                <Text style={styles.tileSubtitle} numberOfLines={2}>{f.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        {showThemeStep && (
          <>
            <View style={[styles.sectionRow, { marginTop: spacing.lg }]}>
              <View style={styles.sectionLabelRow}>
                <Ionicons name="color-palette-outline" size={13} color="#22D3EE" />
                <Text style={styles.sectionLabel}>STREAMER THEME</Text>
              </View>
              <Text style={styles.sectionHint}>Live room accent</Text>
            </View>
            <View style={styles.grid}>
              {THEMES.map((t) => {
                const isSelected = selectedTheme === t.key;
                return (
                  <Pressable
                    key={t.key}
                    style={[styles.themeTile, isSelected && styles.themeTileSelected]}
                    onPress={() => setSelectedTheme(t.key)}
                  >
                    <View style={styles.themeTop}>
                      <View style={[styles.themeSwatch, { backgroundColor: t.hex }]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                      <Text style={styles.themeName}>{t.name}</Text>
                    </View>
                    <Text style={styles.themeSubtitle} numberOfLines={1}>{t.subtitle}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.guidelinesNotice}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#2DD4BF" />
              <Text style={styles.guidelinesText}>
                Streamers must follow Rryda Live Community & safety rules.
              </Text>
            </View>

            <Pressable onPress={handleGoLive} style={styles.goLiveWrap}>
              <LinearGradient
                colors={['#22D3EE', colors.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.goLiveButton}
              >
                <Text style={styles.goLiveText}>GO LIVE NOW</Text>
                <Ionicons name="rocket" size={18} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0F1E' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl },
  backButton: { padding: spacing.xs },
  headerTitle: { ...type.h2, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  sectionLabel: { ...type.caption, color: colors.textMuted, fontWeight: '800', letterSpacing: 1 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHint: { ...type.caption, color: colors.textMuted },
  titleInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  titleEmoji: { fontSize: 16 },
  titleInput: { flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  tile: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.sm,
  },
  tileSelected: { borderColor: '#22D3EE', backgroundColor: 'rgba(34,211,238,0.08)' },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  tileTitle: { ...type.bodyStrong, color: colors.textPrimary, marginTop: spacing.sm },
  tileSubtitle: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  themeTile: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.sm,
  },
  themeTileSelected: { borderColor: '#22D3EE', backgroundColor: 'rgba(34,211,238,0.08)' },
  themeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  themeSwatch: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  themeName: { ...type.bodyStrong, color: colors.textPrimary, fontSize: 13 },
  themeSubtitle: { ...type.caption, color: colors.textMuted, marginTop: 4 },
  guidelinesNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(45,212,191,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.lg,
  },
  guidelinesText: { flex: 1, ...type.caption, color: colors.textSecondary },
  goLiveWrap: { borderRadius: radii.pill, overflow: 'hidden', marginTop: spacing.md },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  goLiveText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});
