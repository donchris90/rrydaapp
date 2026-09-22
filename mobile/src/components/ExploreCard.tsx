import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FeedUser } from '../api/types';
import { countryCodeToFlag } from '../utils/country';
import { PressableScale } from './PressableScale';
import { LiveBadge } from './LiveBadge';
import { colors, radii, spacing } from '../theme';

// The reference apps (Bigo/PoppoLive/Migle) fill this card with a live
// video thumbnail plus viewer count and a category tag. There's still no
// thumbnail (no cover image field exists on the feed shape) and no viewer
// count (not tracked anywhere), so this doesn't fabricate either — but
// `isLive` IS now a real signal (feed.service.ts's attachLiveStatus reads
// LiveSession), so the one honest piece of that treatment — the LIVE
// badge — is real. This renders a gradient "art card" (deterministic per
// user, so the same person always gets the same look) with their initial,
// name, and real flag, plus the LIVE badge when it's true.
const CARD_GRADIENTS: readonly (readonly [string, string])[] = [
  [colors.primary, colors.pink],
  [colors.pink, colors.goldDeep],
  [colors.primaryDeep, colors.pinkDeep],
  [colors.goldDeep, colors.pink],
  [colors.pinkDeep, colors.primary],
];

function gradientForId(id: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length];
}

export function ExploreCard({ user }: { user: FeedUser }) {
  const initial = (user.displayName?.trim()?.[0] ?? '?').toUpperCase();
  const gradient = gradientForId(user.id);

  return (
    <PressableScale style={styles.card} scaleTo={0.97}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Text style={styles.initial}>{initial}</Text>
      {user.isLive && (
        <View style={styles.liveBadgeWrap}>
          <LiveBadge size="sm" />
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(8,4,20,0.88)']} style={styles.scrim} />
      <View style={styles.footer}>
        <Text style={styles.name} numberOfLines={1}>
          {user.displayName ?? 'Unnamed user'}
        </Text>
        <Text style={styles.flag}>{countryCodeToFlag(user.countryCode)}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: radii.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  initial: {
    fontSize: 48,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.35)',
  },
  liveBadgeWrap: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  footer: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { flex: 1, color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  flag: { fontSize: 14, marginLeft: 4 },
});
