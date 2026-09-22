import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, spacing, type } from '../theme';

export interface SoundEffectItem {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  color: string;
}

export const SOUND_EFFECTS: SoundEffectItem[] = [
  { id: 'applause', name: 'Applause', icon: 'hand-left', emoji: '👏', color: '#FFB800' },
  { id: 'cheer', name: 'Cheer', icon: 'sparkles', emoji: '🥳', color: '#FF2E7E' },
  { id: 'airhorn', name: 'Air Horn', icon: 'volume-high', emoji: '🎺', color: '#FF2E7E' },
  { id: 'laugh', name: 'Laughter', icon: 'happy', emoji: '😂', color: '#10B981' },
  { id: 'drumroll', name: 'Drumroll', icon: 'musical-notes', emoji: '🥁', color: '#3B82F6' },
  { id: 'kiss', name: 'Mwah', icon: 'heart', emoji: '💋', color: '#EC4899' },
  { id: 'fanfare', name: 'Victory', icon: 'trophy', emoji: '🏆', color: '#F59E0B' },
  { id: 'laser', name: 'Laser Beam', icon: 'flash', emoji: '⚡', color: '#06B6D4' },
];

export const VOICE_PRESETS = [
  { id: 'original', name: 'Original', icon: 'mic-outline' },
  { id: 'studio', name: 'Studio', icon: 'headset-outline' },
  { id: 'reverb', name: 'Reverb', icon: 'radio-outline' },
  { id: 'karaoke', name: 'Karaoke', icon: 'disc-outline' },
  { id: 'concert', name: 'Concert', icon: 'pulse-outline' },
  { id: 'robot', name: 'Robot', icon: 'hardware-chip-outline' },
  { id: 'deep', name: 'Deep Voice', icon: 'trending-down-outline' },
];

export const BGM_TRACKS = [
  { id: 'lofi', title: 'Lo-Fi Chill Vibes', duration: '2:45' },
  { id: 'lounge', title: 'Acoustic Sunset Lounge', duration: '3:10' },
  { id: 'club', title: 'Cyberpunk Neon Pulse', duration: '2:20' },
  { id: 'piano', title: 'Gentle Piano Romance', duration: '3:30' },
];

interface SoundboardModalProps {
  visible: boolean;
  onClose: () => void;
  onPlaySound: (effectId: string) => void;
  activeBgm: string | null;
  onToggleBgm: (trackId: string) => void;
  activeVoicePreset: string;
  onSelectVoicePreset: (presetId: string) => void;
}

export function SoundboardModal({
  visible,
  onClose,
  onPlaySound,
  activeBgm,
  onToggleBgm,
  activeVoicePreset,
  onSelectVoicePreset,
}: SoundboardModalProps) {
  const [activeTab, setActiveTab] = useState<'sfx' | 'bgm' | 'voice'>('sfx');
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  const handlePlay = (id: string) => {
    setLastPlayed(id);
    onPlaySound(id);
    setTimeout(() => setLastPlayed(null), 600);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="musical-notes" size={20} color={colors.primaryLight} />
              <Text style={styles.sheetTitle}>Party Soundboard & Audio FX</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'sfx' && styles.tabBtnActive]}
              onPress={() => setActiveTab('sfx')}
            >
              <Text style={[styles.tabText, activeTab === 'sfx' && styles.tabTextActive]}>
                Sound FX
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'bgm' && styles.tabBtnActive]}
              onPress={() => setActiveTab('bgm')}
            >
              <Text style={[styles.tabText, activeTab === 'bgm' && styles.tabTextActive]}>
                BGM Music
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'voice' && styles.tabBtnActive]}
              onPress={() => setActiveTab('voice')}
            >
              <Text style={[styles.tabText, activeTab === 'voice' && styles.tabTextActive]}>
                Voice Pitch & DSP
              </Text>
            </Pressable>
          </View>

          {/* Content Area */}
          <ScrollView contentContainerStyle={styles.contentScroll}>
            {activeTab === 'sfx' && (
              <View style={styles.sfxGrid}>
                {SOUND_EFFECTS.map((sfx) => {
                  const isPlaying = lastPlayed === sfx.id;
                  return (
                    <Pressable
                      key={sfx.id}
                      style={[
                        styles.sfxPad,
                        isPlaying && { borderColor: sfx.color, backgroundColor: 'rgba(255,255,255,0.15)' },
                      ]}
                      onPress={() => handlePlay(sfx.id)}
                    >
                      <Text style={styles.sfxEmoji}>{sfx.emoji}</Text>
                      <Text style={styles.sfxName}>{sfx.name}</Text>
                      {isPlaying && (
                        <View style={[styles.sfxPlayingDot, { backgroundColor: sfx.color }]} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {activeTab === 'bgm' && (
              <View style={styles.bgmList}>
                <Text style={styles.sectionSubtitle}>
                  Background audio stream with automatic voice ducking
                </Text>
                {BGM_TRACKS.map((track) => {
                  const isPlaying = activeBgm === track.id;
                  return (
                    <Pressable
                      key={track.id}
                      style={[styles.bgmItem, isPlaying && styles.bgmItemActive]}
                      onPress={() => onToggleBgm(track.id)}
                    >
                      <View style={styles.bgmInfo}>
                        <View
                          style={[
                            styles.bgmIconWrap,
                            isPlaying && { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons
                            name={isPlaying ? 'volume-high' : 'disc-outline'}
                            size={18}
                            color="#FFFFFF"
                          />
                        </View>
                        <View>
                          <Text style={styles.bgmTitle}>{track.title}</Text>
                          <Text style={styles.bgmMeta}>{track.duration} • Loop</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.bgmActionPill,
                          isPlaying && { backgroundColor: colors.primary },
                        ]}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause' : 'play'}
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text style={styles.bgmActionText}>
                          {isPlaying ? 'Playing' : 'Play'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {activeTab === 'voice' && (
              <View style={styles.voiceList}>
                <Text style={styles.sectionSubtitle}>
                  Agora Audio DSP Effects applied in real-time to microphone
                </Text>
                <View style={styles.voiceGrid}>
                  {VOICE_PRESETS.map((vp) => {
                    const isSelected = activeVoicePreset === vp.id;
                    return (
                      <Pressable
                        key={vp.id}
                        style={[
                          styles.voiceCard,
                          isSelected && styles.voiceCardActive,
                        ]}
                        onPress={() => onSelectVoicePreset(vp.id)}
                      >
                        <Ionicons
                          name={vp.icon as any}
                          size={22}
                          color={isSelected ? colors.primaryLight : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.voiceName,
                            isSelected && styles.voiceNameActive,
                          ]}
                        >
                          {vp.name}
                        </Text>
                        {isSelected && (
                          <LinearGradient
                            colors={gradients.hero}
                            style={styles.activeCheck}
                          >
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </LinearGradient>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1438',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '65%',
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  sfxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sfxPad: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sfxEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  sfxName: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  sfxPlayingDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bgmList: {
    gap: spacing.sm,
  },
  bgmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  bgmItemActive: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  bgmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bgmIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgmTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  bgmMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  bgmActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  bgmActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  voiceList: {},
  voiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  voiceCard: {
    width: '30.5%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 6,
  },
  voiceCardActive: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(138, 79, 255, 0.18)',
  },
  voiceName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  voiceNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
