import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface BeautySettings {
  enabled: boolean;
  smoothing: number;
  whitening: number;
  slimFace: number;
  bigEyes: number;
  blush: number;
  filterPreset: string;
}

interface BeautySheetProps {
  visible: boolean;
  onClose: () => void;
  settings: BeautySettings;
  onChangeSettings: (settings: BeautySettings) => void;
}

const FILTER_PRESETS = [
  { id: 'none', name: 'Original', color: '#888' },
  { id: 'warm', name: 'Warm Sunset', color: '#FFA07A' },
  { id: 'rosy', name: 'Rosy Peach', color: '#FF69B4' },
  { id: 'fresh', name: 'Fresh Glow', color: '#87CEEB' },
  { id: 'caramel', name: 'Caramel', color: '#D2691E' },
  { id: 'cyber', name: 'Cyber Neon', color: '#9370DB' },
];

export function BeautySheet({
  visible,
  onClose,
  settings,
  onChangeSettings,
}: BeautySheetProps) {
  const [activeTab, setActiveTab] = useState<'beauty' | 'filters'>('beauty');

  const updateField = (key: keyof BeautySettings, value: any) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  const resetDefaults = () => {
    onChangeSettings({
      enabled: true,
      smoothing: 50,
      whitening: 40,
      slimFace: 30,
      bigEyes: 20,
      blush: 25,
      filterPreset: 'none',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="sparkles" size={18} color="#FF3D8A" />
              <Text style={styles.headerTitle}>Studio Beauty & Filters</Text>
            </View>

            <View style={styles.headerControls}>
              <Switch
                value={settings.enabled}
                onValueChange={(val) => updateField('enabled', val)}
                trackColor={{ false: '#3A3268', true: '#7B4DFF' }}
                thumbColor={settings.enabled ? '#FFF' : '#AAA'}
              />
              <Pressable onPress={resetDefaults} style={styles.resetBtn}>
                <Ionicons name="refresh" size={14} color="#B0A6D6" />
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setActiveTab('beauty')}
              style={[styles.tabBtn, activeTab === 'beauty' && styles.activeTabBtn]}
            >
              <Text style={[styles.tabText, activeTab === 'beauty' && styles.activeTabText]}>
                Facial Retouch
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('filters')}
              style={[styles.tabBtn, activeTab === 'filters' && styles.activeTabBtn]}
            >
              <Text style={[styles.tabText, activeTab === 'filters' && styles.activeTabText]}>
                Color Grading
              </Text>
            </Pressable>
          </View>

          {/* Tab 1: Retouch Sliders */}
          {activeTab === 'beauty' ? (
            <ScrollView style={styles.sliderList} showsVerticalScrollIndicator={false}>
              <SliderRow
                label="Smooth Skin"
                icon="water-outline"
                value={settings.smoothing}
                onChange={(v) => updateField('smoothing', v)}
                disabled={!settings.enabled}
              />
              <SliderRow
                label="Skin Brighten"
                icon="sunny-outline"
                value={settings.whitening}
                onChange={(v) => updateField('whitening', v)}
                disabled={!settings.enabled}
              />
              <SliderRow
                label="Slim Face"
                icon="scan-outline"
                value={settings.slimFace}
                onChange={(v) => updateField('slimFace', v)}
                disabled={!settings.enabled}
              />
              <SliderRow
                label="Enlarge Eyes"
                icon="eye-outline"
                value={settings.bigEyes}
                onChange={(v) => updateField('bigEyes', v)}
                disabled={!settings.enabled}
              />
              <SliderRow
                label="Blush / Rosy"
                icon="heart-outline"
                value={settings.blush}
                onChange={(v) => updateField('blush', v)}
                disabled={!settings.enabled}
              />
            </ScrollView>
          ) : (
            /* Tab 2: Color Filters Presets */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}
            >
              {FILTER_PRESETS.map((preset) => {
                const isSelected = settings.filterPreset === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => updateField('filterPreset', preset.id)}
                    style={[styles.presetCard, isSelected && styles.activePresetCard]}
                  >
                    <View style={[styles.presetPreviewCircle, { backgroundColor: preset.color }]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={[styles.presetName, isSelected && styles.activePresetName]}>
                      {preset.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SliderRow({
  label,
  icon,
  value,
  onChange,
  disabled,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
}) {
  return (
    <View style={[styles.sliderItem, disabled && { opacity: 0.4 }]}>
      <View style={styles.sliderLabelRow}>
        <View style={styles.sliderTitleWrap}>
          <Ionicons name={icon} size={16} color="#FF3D8A" />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        <Text style={styles.sliderValText}>{Math.round(value)}%</Text>
      </View>
      <Slider
        style={styles.sliderBar}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#7B4DFF"
        maximumTrackTintColor="#2E2453"
        thumbTintColor="#FFF"
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#1A1332',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: 450,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resetText: {
    color: '#B0A6D6',
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#241A3D',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTabBtn: {
    backgroundColor: '#7B4DFF',
  },
  tabText: {
    color: '#B0A6D6',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '700',
  },
  sliderList: {
    paddingBottom: 10,
  },
  sliderItem: {
    marginBottom: 14,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sliderLabel: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
  },
  sliderValText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  sliderBar: {
    width: '100%',
    height: 32,
  },
  presetsContainer: {
    paddingVertical: 12,
    gap: 12,
  },
  presetCard: {
    alignItems: 'center',
    width: 72,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#241A3D',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activePresetCard: {
    borderColor: '#FF3D8A',
    backgroundColor: '#2E2453',
  },
  presetPreviewCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  presetName: {
    color: '#B0A6D6',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  activePresetName: {
    color: '#FFF',
    fontWeight: '700',
  },
});
