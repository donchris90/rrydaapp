import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from './luckyNumberTheme';
import type { SoundSettings } from './luckyNumberTypes';

interface DiceHeaderProps {
  onClose?: () => void;
  soundSettings?: SoundSettings;
  onOpenSoundSettings?: () => void;
}

export function DiceHeader({
  onClose,
  soundSettings,
  onOpenSoundSettings,
}: DiceHeaderProps) {
  const isMuted = soundSettings ? !soundSettings.master : false;

  return (
    <View style={styles.headerContainer}>
      {/* Top Left Sound Settings Button */}
      <Pressable
        onPress={onOpenSoundSettings}
        style={({ pressed }) => [
          styles.soundButton,
          pressed && styles.buttonPressed,
          isMuted && styles.soundButtonMuted,
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Sound Settings"
      >
        <Text style={styles.soundIcon}>{isMuted ? '🔇' : '🔊'}</Text>
      </Pressable>

      {/* Background Radial Glow & Sparkles */}
      <View style={styles.sparkle1} />
      <View style={styles.sparkle2} />
      <View style={styles.sparkle3} />
      <View style={styles.sparkle4} />

      {/* 3D Bubble Title "LUCKY NUMBER!" */}
      <View style={styles.titleContainer}>
        {/* "LUCKY" 3D Yellow Bubble Word */}
        <View style={styles.luckyWordRow}>
          {['L', 'U', 'C', 'K', 'Y'].map((letter, idx) => (
            <View key={idx} style={styles.luckyLetterBox}>
              {/* Bottom shadow for 3D depth */}
              <View style={styles.luckyLetterShadow}>
                <Text style={styles.luckyLetterShadowText}>{letter}</Text>
              </View>
              {/* Front main letter with gradient feel and gloss */}
              <View style={styles.luckyLetterFront}>
                <Text style={styles.luckyLetterText}>{letter}</Text>
                {/* Top gloss highlight */}
                <View style={styles.letterGloss} />
              </View>
            </View>
          ))}
        </View>

        {/* "NUMBER!" 3D Electric Blue Word */}
        <View style={styles.numberWordRow}>
          {['N', 'U', 'M', 'B', 'E', 'R', '!'].map((letter, idx) => (
            <View key={idx} style={styles.numberLetterBox}>
              <View style={styles.numberLetterShadow}>
                <Text style={styles.numberLetterShadowText}>{letter}</Text>
              </View>
              <View style={styles.numberLetterFront}>
                <Text style={styles.numberLetterText}>{letter}</Text>
                <View style={styles.numberGloss} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Top Right Close Button */}
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && styles.buttonPressed,
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 10,
    position: 'relative',
  },
  soundButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 58, 138, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  soundButtonMuted: {
    backgroundColor: 'rgba(51, 65, 85, 0.65)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  soundIcon: {
    fontSize: 13,
  },
  sparkle1: {
    position: 'absolute',
    top: 15,
    left: '12%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    opacity: 0.8,
  },
  sparkle2: {
    position: 'absolute',
    top: 35,
    right: '14%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FEF08A',
    opacity: 0.9,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 12,
    left: '8%',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  sparkle4: {
    position: 'absolute',
    top: 8,
    right: '24%',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#60A5FA',
    opacity: 0.75,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  luckyWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: -4,
  },
  luckyLetterBox: {
    position: 'relative',
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  luckyLetterShadow: {
    position: 'absolute',
    bottom: 0,
    width: 42,
    height: 44,
    backgroundColor: '#D97706',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#B45309',
  },
  luckyLetterShadowText: {
    fontSize: 28,
    fontWeight: '900',
    color: 'transparent',
  },
  luckyLetterFront: {
    position: 'absolute',
    top: 0,
    width: 42,
    height: 42,
    backgroundColor: '#FACC15',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FEF08A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  luckyLetterText: {
    fontSize: 27,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: -0.5,
  },
  letterGloss: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 6,
  },
  numberWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  numberLetterBox: {
    position: 'relative',
    width: 38,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberLetterShadow: {
    position: 'absolute',
    bottom: 0,
    width: 36,
    height: 44,
    backgroundColor: '#0369A1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#075985',
  },
  numberLetterShadowText: {
    fontSize: 26,
    fontWeight: '900',
    color: 'transparent',
  },
  numberLetterFront: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 40,
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  numberLetterText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#082F49',
    letterSpacing: -0.5,
  },
  numberGloss: {
    position: 'absolute',
    top: 2,
    left: 3,
    right: 3,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 58, 138, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  closeText: {
    color: '#BAE6FD',
    fontSize: 14,
    fontWeight: '700',
  },
});
