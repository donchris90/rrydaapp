import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../theme';

export interface BeautyOptions {
  enabled: boolean;
  smoothnessLevel: number; // 0.0 - 1.0
  lighteningLevel: number; // 0.0 - 1.0
  rednessLevel: number; // 0.0 - 1.0
  chinSlimming: number; // 0 - 100
  eyeEnlarge: number; // 0 - 100
  virtualBackgroundBlur: boolean;
}

interface BeautyFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  beauty: BeautyOptions;
  onChangeBeauty: (next: Partial<BeautyOptions>) => void;
  onSwitchCamera?: () => void;
}

export function BeautyFilterSheet({
  visible,
  onClose,
  beauty,
  onChangeBeauty,
  onSwitchCamera,
}: BeautyFilterSheetProps) {
  const [activeTab, setActiveTab] = useState<'skin' | 'shape' | 'background'>('skin');

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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={18} color={colors.primaryLight} />
              <Text style={styles.headerTitle}>Beauty Filters & Video Retouch</Text>
            </View>

            <View style={styles.headerRight}>
              {onSwitchCamera && (
                <Pressable onPress={onSwitchCamera} style={styles.flipBtn}>
                  <Ionicons name="camera-reverse" size={16} color="#FFF" />
                  <Text style={styles.flipText}>Flip</Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Master Toggle */}
          <View style={styles.masterRow}>
            <View>
              <Text style={styles.masterLabel}>AI Beauty Engine</Text>
              <Text style={styles.masterSub}>Real-time facial smoothing & brightening</Text>
            </View>
            <Switch
              value={beauty.enabled}
              onValueChange={(val) => onChangeBeauty({ enabled: val })}
              trackColor={{ false: '#3A2E59', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Tab Row */}
          <View style={styles.tabRow}>
            {[
              { id: 'skin', label: 'Skin Glow' },
              { id: 'shape', label: 'Face Retouch' },
              { id: 'background', label: 'Background' },
            ].map((t) => (
              <Pressable
                key={t.id}
                style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
                onPress={() => setActiveTab(t.id as any)}
              >
                <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Controls Body */}
          <ScrollView contentContainerStyle={styles.bodyContent}>
            {activeTab === 'skin' && (
              <View style={styles.controlGroup}>
                {/* Smoothness Level */}
                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Skin Smoothing</Text>
                    <Text style={styles.sliderValue}>{Math.round(beauty.smoothnessLevel * 100)}%</Text>
                  </View>
                  <View style={styles.stepsRow}>
                    {[0, 0.25, 0.5, 0.75, 1.0].map((step) => (
                      <Pressable
                        key={step}
                        style={[
                          styles.stepPill,
                          beauty.smoothnessLevel === step && styles.stepPillActive,
                        ]}
                        onPress={() => onChangeBeauty({ smoothnessLevel: step })}
                      >
                        <Text
                          style={[
                            styles.stepText,
                            beauty.smoothnessLevel === step && styles.stepTextActive,
                          ]}
                        >
                          {step === 0 ? 'Off' : `${Math.round(step * 100)}%`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Lightening Brightness */}
                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Skin Whitening & Lightening</Text>
                    <Text style={styles.sliderValue}>{Math.round(beauty.lighteningLevel * 100)}%</Text>
                  </View>
                  <View style={styles.stepsRow}>
                    {[0, 0.25, 0.5, 0.75, 1.0].map((step) => (
                      <Pressable
                        key={step}
                        style={[
                          styles.stepPill,
                          beauty.lighteningLevel === step && styles.stepPillActive,
                        ]}
                        onPress={() => onChangeBeauty({ lighteningLevel: step })}
                      >
                        <Text
                          style={[
                            styles.stepText,
                            beauty.lighteningLevel === step && styles.stepTextActive,
                          ]}
                        >
                          {step === 0 ? 'Off' : `${Math.round(step * 100)}%`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Rosy Blush */}
                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Rosy Blush Tint</Text>
                    <Text style={styles.sliderValue}>{Math.round(beauty.rednessLevel * 100)}%</Text>
                  </View>
                  <View style={styles.stepsRow}>
                    {[0, 0.2, 0.4, 0.6, 0.8].map((step) => (
                      <Pressable
                        key={step}
                        style={[
                          styles.stepPill,
                          beauty.rednessLevel === step && styles.stepPillActive,
                        ]}
                        onPress={() => onChangeBeauty({ rednessLevel: step })}
                      >
                        <Text
                          style={[
                            styles.stepText,
                            beauty.rednessLevel === step && styles.stepTextActive,
                          ]}
                        >
                          {step === 0 ? 'Off' : `${Math.round(step * 100)}%`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'shape' && (
              <View style={styles.controlGroup}>
                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>V-Shape Chin Slimming</Text>
                    <Text style={styles.sliderValue}>{beauty.chinSlimming}%</Text>
                  </View>
                  <View style={styles.stepsRow}>
                    {[0, 25, 50, 75, 100].map((val) => (
                      <Pressable
                        key={val}
                        style={[
                          styles.stepPill,
                          beauty.chinSlimming === val && styles.stepPillActive,
                        ]}
                        onPress={() => onChangeBeauty({ chinSlimming: val })}
                      >
                        <Text
                          style={[
                            styles.stepText,
                            beauty.chinSlimming === val && styles.stepTextActive,
                          ]}
                        >
                          {val === 0 ? 'Natural' : `${val}%`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Eye Enlarging</Text>
                    <Text style={styles.sliderValue}>{beauty.eyeEnlarge}%</Text>
                  </View>
                  <View style={styles.stepsRow}>
                    {[0, 25, 50, 75, 100].map((val) => (
                      <Pressable
                        key={val}
                        style={[
                          styles.stepPill,
                          beauty.eyeEnlarge === val && styles.stepPillActive,
                        ]}
                        onPress={() => onChangeBeauty({ eyeEnlarge: val })}
                      >
                        <Text
                          style={[
                            styles.stepText,
                            beauty.eyeEnlarge === val && styles.stepTextActive,
                          ]}
                        >
                          {val === 0 ? 'Natural' : `${val}%`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'background' && (
              <View style={styles.controlGroup}>
                <View style={styles.bgCard}>
                  <View style={styles.bgCardLeft}>
                    <Ionicons name="contrast-outline" size={24} color={colors.primaryLight} />
                    <View>
                      <Text style={styles.bgCardTitle}>Portrait Background Blur</Text>
                      <Text style={styles.bgCardSub}>Bokeh depth-of-field blur behind speaker</Text>
                    </View>
                  </View>
                  <Switch
                    value={beauty.virtualBackgroundBlur}
                    onValueChange={(val) => onChangeBeauty({ virtualBackgroundBlur: val })}
                    trackColor={{ false: '#3A2E59', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
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
    paddingBottom: spacing.xl,
    maxHeight: '75%',
  },
  header: {
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
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  flipText: {
    color: '#FFF',
    fontSize: 11,
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
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  masterLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  masterSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
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
  bodyContent: {
    paddingHorizontal: spacing.md,
  },
  controlGroup: {
    gap: spacing.sm,
  },
  sliderBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sliderLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  sliderValue: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: colors.primary,
  },
  stepText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  stepTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  bgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  bgCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  bgCardTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  bgCardSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
