import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hubColors, hubGradients, hubTint } from '../../theme';
import { Avatar } from '../Avatar';
import { PressableScale } from '../PressableScale';

// Ports rryda-games-hub's NavigationHeader.tsx: brand mark, wallet balance
// pill, and profile chip with a streak flame. Two pieces of that reference
// header are deliberately NOT ported:
//  - the sound-mute and mobile/desktop-frame toggles, which only exist to
//    control the web preview harness itself, not anything a phone app has;
//  - the "+1K" button, which in the reference just grants free coins on
//    tap. Porting that here would be a real dupe-coins exploit, not a
//    design detail — it's replaced with a "+" that opens the real Buy
//    Coins flow, keeping the same visual pill/button shape.
export function HubHeader({
  coins,
  coinsLoading,
  displayName,
  avatarUrl,
  streak,
  onPressWallet,
  onPressProfile,
}: {
  coins: number;
  coinsLoading: boolean;
  displayName: string;
  avatarUrl: string | null;
  streak: number;
  onPressWallet: () => void;
  onPressProfile: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <LinearGradient colors={hubGradients.brandMark} style={styles.brandMark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <View style={styles.brandNameRow}>
            <Text style={styles.brandName}>RRYDA</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>GAMES HUB</Text>
            </View>
          </View>
          <Text style={styles.brandTagline}>Live Creator Arcade & Mini Games</Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <PressableScale style={styles.walletPill} onPress={onPressWallet}>
          <Text style={styles.walletCoinIcon}>🪙</Text>
          <Text style={styles.walletValue}>{coinsLoading ? '—' : coins.toLocaleString()}</Text>
          <View style={styles.walletAddButton}>
            <Ionicons name="add" size={14} color={hubColors.bg} />
          </View>
        </PressableScale>

        <PressableScale style={styles.profileChip} onPress={onPressProfile}>
          <Avatar name={displayName} imageUrl={avatarUrl} size={24} ring={false} />
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={10} color={hubColors.amber400} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: hubColors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: hubColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  brandNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  brandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: hubTint.amber20,
    borderWidth: 1,
    borderColor: hubTint.amber30,
  },
  brandBadgeText: { color: hubColors.amber300, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  brandTagline: { color: hubColors.textSecondary, fontSize: 11, marginTop: 1 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: hubColors.panelRaised,
    borderWidth: 1,
    borderColor: hubColors.border,
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
  },
  walletCoinIcon: { fontSize: 14, marginRight: 5 },
  walletValue: { color: hubColors.amber300, fontWeight: '900', fontSize: 13, marginRight: 6 },
  walletAddButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: hubColors.amber400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: hubColors.panelRaised,
    borderWidth: 1,
    borderColor: hubColors.border,
    borderRadius: 999,
    padding: 3,
    gap: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: hubTint.amber20,
    borderWidth: 1,
    borderColor: hubTint.amber30,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  streakText: { color: hubColors.amber400, fontSize: 10, fontWeight: '900' },
});
