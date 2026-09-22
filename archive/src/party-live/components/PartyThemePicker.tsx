import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../theme';

export interface PartyThemeOption {
  id: string;
  name: string;
  gradient: readonly [string, string];
  icon: string;
}

export const PARTY_THEMES: PartyThemeOption[] = [
  { id: 'cosmic', name: 'Cosmic Nebula', gradient: ['#281754', '#110926'], icon: 'planet-outline' },
  { id: 'neon', name: 'Neon Nightclub', gradient: ['#380F4A', '#130421'], icon: 'flash-outline' },
  { id: 'golden', name: 'Golden Royale', gradient: ['#3A2805', '#160F02'], icon: 'trophy-outline' },
  { id: 'sunset', name: 'Sunset Romance', gradient: ['#4A1230', '#1C0612'], icon: 'heart-outline' },
  { id: 'midnight', name: 'Midnight Lounge', gradient: ['#0A1931', '#040B18'], icon: 'moon-outline' },
];

interface PartyThemePickerProps {
  visible: boolean;
  onClose: () => void;
  activeThemeId: string;
  onSelectTheme: (theme: PartyThemeOption) => void;
}

export function PartyThemePicker({
  visible,
  onClose,
  activeThemeId,
  onSelectTheme,
}: PartyThemePickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Ionicons name="color-palette-outline" size={18} color={colors.primaryLight} />
              <Text style={styles.title}>Room Atmosphere & Wallpaper</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {PARTY_THEMES.map((theme) => {
              const isActive = activeThemeId === theme.id;
              return (
                <Pressable
                  key={theme.id}
                  style={[styles.themeCard, isActive && styles.themeCardActive]}
                  onPress={() => onSelectTheme(theme)}
                >
                  <LinearGradient
                    colors={theme.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientPreview}
                  >
                    <Ionicons name={theme.icon as any} size={24} color="#FFF" />
                  </LinearGradient>
                  <Text style={[styles.themeName, isActive && styles.themeNameActive]}>
                    {theme.name}
                  </Text>
                  {isActive && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E1438',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  themeCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.md,
    padding: spacing.xs * 1.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  themeCardActive: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(138, 79, 255, 0.18)',
  },
  gradientPreview: {
    height: 60,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  themeName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
