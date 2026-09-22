import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  Platform,
} from 'react-native';
import type { SoundSettings } from './luckyNumberTypes';
import { playBetSound, playWinSound, playLoseSound } from '../../utils/diceAudio';

interface DiceSoundSettingsModalProps {
  visible: boolean;
  settings: SoundSettings;
  onUpdateSettings: (newSettings: SoundSettings) => void;
  onClose: () => void;
}

export function DiceSoundSettingsModal({
  visible,
  settings,
  onUpdateSettings,
  onClose,
}: DiceSoundSettingsModalProps) {
  const handleToggle = (key: keyof SoundSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    onUpdateSettings(updated);

    // If enabling a specific sound effect, play a brief sample
    if (!settings[key] && (key === 'master' || settings.master)) {
      if (key === 'betting') playBetSound(updated);
      else if (key === 'win') playWinSound(updated);
      else if (key === 'lose') playLoseSound(updated);
    }
  };

  const handleTestSound = (type: 'betting' | 'win' | 'lose') => {
    if (type === 'betting') playBetSound({ ...settings, master: true, betting: true });
    else if (type === 'win') playWinSound({ ...settings, master: true, win: true });
    else if (type === 'lose') playLoseSound({ ...settings, master: true, lose: true });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.headerIcon}>🔊</Text>
              <View>
                <Text style={styles.headerTitle}>Sound Settings</Text>
                <Text style={styles.headerSubtitle}>Customize audio & haptic feedback</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Master Sound Switch */}
          <View style={styles.masterRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.masterLabel}>Master Sound</Text>
              <Text style={styles.settingDescription}>
                Enable or mute all game audio
              </Text>
            </View>
            <Switch
              value={settings.master}
              onValueChange={() => handleToggle('master')}
              trackColor={{ false: '#334155', true: '#F59E0B' }}
              thumbColor={settings.master ? '#FFFBEB' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          {/* Individual Sound Toggles */}
          <View style={styles.togglesList}>
            {/* 1. Betting Sound Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Text style={styles.pillEmoji}>🪙</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Betting SFX</Text>
                  <Text style={styles.settingDescription}>
                    Chips, grid taps & bet confirmations
                  </Text>
                </View>
              </View>

              <View style={styles.actionGroup}>
                <Pressable
                  onPress={() => handleTestSound('betting')}
                  style={({ pressed }) => [
                    styles.testButton,
                    pressed && styles.testButtonPressed,
                  ]}
                  accessibilityLabel="Test Betting Sound"
                >
                  <Text style={styles.testButtonText}>Test</Text>
                </Pressable>
                <Switch
                  value={settings.betting && settings.master}
                  disabled={!settings.master}
                  onValueChange={() => handleToggle('betting')}
                  trackColor={{ false: '#334155', true: '#38BDF8' }}
                  thumbColor={settings.betting && settings.master ? '#F0F9FF' : '#94A3B8'}
                />
              </View>
            </View>

            {/* 2. Win Sound Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                  <Text style={styles.pillEmoji}>🎉</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Win SFX</Text>
                  <Text style={styles.settingDescription}>
                    Celebrations, multipliers & fanfares
                  </Text>
                </View>
              </View>

              <View style={styles.actionGroup}>
                <Pressable
                  onPress={() => handleTestSound('win')}
                  style={({ pressed }) => [
                    styles.testButton,
                    pressed && styles.testButtonPressed,
                  ]}
                  accessibilityLabel="Test Win Sound"
                >
                  <Text style={styles.testButtonText}>Test</Text>
                </Pressable>
                <Switch
                  value={settings.win && settings.master}
                  disabled={!settings.master}
                  onValueChange={() => handleToggle('win')}
                  trackColor={{ false: '#334155', true: '#F59E0B' }}
                  thumbColor={settings.win && settings.master ? '#FFFBEB' : '#94A3B8'}
                />
              </View>
            </View>

            {/* 3. Lose Sound Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                  <Text style={styles.pillEmoji}>💔</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Lose SFX</Text>
                  <Text style={styles.settingDescription}>
                    Round over & consolation audio
                  </Text>
                </View>
              </View>

              <View style={styles.actionGroup}>
                <Pressable
                  onPress={() => handleTestSound('lose')}
                  style={({ pressed }) => [
                    styles.testButton,
                    pressed && styles.testButtonPressed,
                  ]}
                  accessibilityLabel="Test Lose Sound"
                >
                  <Text style={styles.testButtonText}>Test</Text>
                </Pressable>
                <Switch
                  value={settings.lose && settings.master}
                  disabled={!settings.master}
                  onValueChange={() => handleToggle('lose')}
                  trackColor={{ false: '#334155', true: '#F43F5E' }}
                  thumbColor={settings.lose && settings.master ? '#FFF1F2' : '#94A3B8'}
                />
              </View>
            </View>
          </View>

          {/* Close / Save Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.doneButtonPressed,
            ]}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 28, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dismissArea: {
    ...(StyleSheet.absoluteFill as any),
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F1648',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(28, 38, 96, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  masterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDE047',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    marginVertical: 14,
  },
  togglesList: {
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 24, 66, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillEmoji: {
    fontSize: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  settingDescription: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  testButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  testButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: '#F59E0B',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  } as any,
  doneButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  doneButtonText: {
    color: '#1E1B4B',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
