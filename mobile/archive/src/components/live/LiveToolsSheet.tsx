import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LiveToolsSheetProps {
  visible: boolean;
  onClose: () => void;
  isMicMuted: boolean;
  toggleMic: () => void;
  switchCamera: () => void;
  isNoiseSuppressionOn: boolean;
  toggleNoiseSuppression: () => void;
  onOpenBeauty: () => void;
  onOpenPk: () => void;
  onTriggerSound: (soundKey: string) => void;
  streamQuality: string;
  onChangeQuality: (q: string) => void;
}

const SOUND_FX = [
  { key: 'cheer', label: 'Cheers', icon: 'sparkles', color: '#FFC24B' },
  { key: 'applause', label: 'Applause', icon: 'hand-left', color: '#FF2E7E' },
  { key: 'laugh', label: 'Laughter', icon: 'happy', color: '#3DF5A0' },
  { key: 'airhorn', label: 'Airhorn', icon: 'megaphone', color: '#FF2E7E' },
  { key: 'drumroll', label: 'Drumroll', icon: 'musical-notes', color: '#00E5FF' },
  { key: 'fanfare', label: 'Victory', icon: 'trophy', color: '#FFA500' },
];

export function LiveToolsSheet({
  visible,
  onClose,
  isMicMuted,
  toggleMic,
  switchCamera,
  isNoiseSuppressionOn,
  toggleNoiseSuppression,
  onOpenBeauty,
  onOpenPk,
  onTriggerSound,
  streamQuality,
  onChangeQuality,
}: LiveToolsSheetProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'sounds' | 'quality'>('tools');

  const handleShare = () => {
    Share.share({
      message: 'Come watch my live stream on Rryda! 🔥 Join now to chat and send gifts!',
    }).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Host Studio Tools</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </Pressable>
          </View>

          {/* Quick Segment Tabs */}
          <View style={styles.segmentBar}>
            <Pressable
              onPress={() => setActiveTab('tools')}
              style={[styles.segmentBtn, activeTab === 'tools' && styles.activeSegmentBtn]}
            >
              <Text style={[styles.segmentText, activeTab === 'tools' && styles.activeSegmentText]}>
                Hardware & Modes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('sounds')}
              style={[styles.segmentBtn, activeTab === 'sounds' && styles.activeSegmentBtn]}
            >
              <Text style={[styles.segmentText, activeTab === 'sounds' && styles.activeSegmentText]}>
                Soundboard FX
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('quality')}
              style={[styles.segmentBtn, activeTab === 'quality' && styles.activeSegmentBtn]}
            >
              <Text style={[styles.segmentText, activeTab === 'quality' && styles.activeSegmentText]}>
                Bitrate & Quality
              </Text>
            </Pressable>
          </View>

          {activeTab === 'tools' && (
            <View style={styles.grid}>
              {/* Flip Camera */}
              <Pressable style={styles.toolTile} onPress={switchCamera}>
                <View style={[styles.toolIconWrap, { backgroundColor: '#382B66' }]}>
                  <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
                </View>
                <Text style={styles.toolLabel}>Flip Cam</Text>
              </Pressable>

              {/* Mic Toggle */}
              <Pressable style={styles.toolTile} onPress={toggleMic}>
                <View
                  style={[
                    styles.toolIconWrap,
                    { backgroundColor: isMicMuted ? '#FF4D67' : '#382B66' },
                  ]}
                >
                  <Ionicons
                    name={isMicMuted ? 'mic-off-outline' : 'mic-outline'}
                    size={24}
                    color="#FFF"
                  />
                </View>
                <Text style={styles.toolLabel}>{isMicMuted ? 'Muted' : 'Mic Active'}</Text>
              </Pressable>

              {/* Beauty FX */}
              <Pressable
                style={styles.toolTile}
                onPress={() => {
                  onClose();
                  onOpenBeauty();
                }}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: '#FF2E7E' }]}>
                  <Ionicons name="sparkles" size={24} color="#FFF" />
                </View>
                <Text style={styles.toolLabel}>Beauty AR</Text>
              </Pressable>

              {/* PK Battle Match */}
              <Pressable
                style={styles.toolTile}
                onPress={() => {
                  onClose();
                  onOpenPk();
                }}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: '#FFC24B' }]}>
                  <Ionicons name="flash" size={24} color="#F6F8FC" />
                </View>
                <Text style={styles.toolLabel}>PK Battle</Text>
              </Pressable>

              {/* AI Noise Suppression */}
              <Pressable style={styles.toolTile} onPress={toggleNoiseSuppression}>
                <View
                  style={[
                    styles.toolIconWrap,
                    { backgroundColor: isNoiseSuppressionOn ? '#3DF5A0' : '#382B66' },
                  ]}
                >
                  <Ionicons
                    name="ear-outline"
                    size={24}
                    color={isNoiseSuppressionOn ? '#F6F8FC' : '#FFF'}
                  />
                </View>
                <Text style={styles.toolLabel}>AI Audio Denoise</Text>
              </Pressable>

              {/* Share Live */}
              <Pressable style={styles.toolTile} onPress={handleShare}>
                <View style={[styles.toolIconWrap, { backgroundColor: '#FF2E7E' }]}>
                  <Ionicons name="share-social-outline" size={24} color="#FFF" />
                </View>
                <Text style={styles.toolLabel}>Share Room</Text>
              </Pressable>
            </View>
          )}

          {activeTab === 'sounds' && (
            <View style={styles.soundsWrap}>
              <Text style={styles.soundHint}>Tap any button to broadcast audio FX to viewers</Text>
              <View style={styles.grid}>
                {SOUND_FX.map((s) => (
                  <Pressable
                    key={s.key}
                    style={styles.toolTile}
                    onPress={() => onTriggerSound(s.key)}
                  >
                    <View style={[styles.toolIconWrap, { backgroundColor: '#F0F3FA' }]}>
                      <Ionicons name={s.icon as any} size={22} color={s.color} />
                    </View>
                    <Text style={styles.toolLabel}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'quality' && (
            <View style={styles.qualityWrap}>
              {['1080p 60fps (Full HD Ultra)', '720p 30fps (Balanced HD)', '480p 30fps (Data Saver)'].map(
                (opt) => {
                  const isSelected = streamQuality.includes(opt.split(' ')[0]);
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => onChangeQuality(opt)}
                      style={[styles.qualityRow, isSelected && styles.activeQualityRow]}
                    >
                      <View>
                        <Text style={[styles.qualityTitle, isSelected && styles.activeQualityTitle]}>
                          {opt}
                        </Text>
                        <Text style={styles.qualitySub}>
                          {opt.includes('1080p')
                            ? 'Recommended for Wi-Fi high speed broadband'
                            : opt.includes('720p')
                            ? 'Optimal stability on standard 4G/5G'
                            : 'Minimizes packet drops in weak signal areas'}
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3DF5A0" />}
                    </Pressable>
                  );
                }
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#F6F8FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#EFF3FA',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeSegmentBtn: {
    backgroundColor: '#FF2E7E',
  },
  segmentText: {
    color: '#B0A6D6',
    fontSize: 12,
    fontWeight: '600',
  },
  activeSegmentText: {
    color: '#FFF',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  toolTile: {
    alignItems: 'center',
    width: 86,
    paddingVertical: 8,
  },
  toolIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  toolLabel: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  soundsWrap: {
    paddingVertical: 4,
  },
  soundHint: {
    color: '#B0A6D6',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  qualityWrap: {
    gap: 8,
    paddingVertical: 6,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#EFF3FA',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeQualityRow: {
    borderColor: '#3DF5A0',
    backgroundColor: '#F0F3FA',
  },
  qualityTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  activeQualityTitle: {
    color: '#3DF5A0',
  },
  qualitySub: {
    color: '#B0A6D6',
    fontSize: 11,
    marginTop: 2,
  },
});
