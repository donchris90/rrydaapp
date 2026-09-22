import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import type { LiveNowSession } from '../api/types';
import { fetchActivePkForHost } from '../api/pk';
import { countryCodeToFlag } from '../utils/country';
import { PressableScale } from './PressableScale';
import { LiveBadge } from './LiveBadge';
import { colors, radii, spacing } from '../theme';

// Home's primary card. The thumbnail is the host's chosen cover image, or
// failing that their profile photo, or failing that a deterministic gradient
// with their initial. (Before covers could be set, nothing ever filled
// coverUrl, so every card was just a gradient.) No viewer count — see
// LiveNowSession's comment for why that'd be fake.
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

function useElapsed(startedAt: string): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
}

export function LiveNowCard({ session, onPress }: { session: LiveNowSession; onPress?: () => void }) {
  const gradient = gradientForId(session.id);
  const elapsed = useElapsed(session.startedAt);
  const thumbnail = session.coverUrl ?? session.hostAvatarUrl;
  const initial = (session.hostDisplayName ?? '?').trim().charAt(0).toUpperCase() || '?';

  // Checked once per card, not polled — a feed screen can show dozens
  // of these at once, and refetching each one every few seconds would
  // mean dozens of simultaneous requests just to render a list. Real
  // data, just refreshed on the same cadence as the rest of the feed
  // (whatever triggers this component to remount/refetch) rather than
  // its own aggressive interval.
  const pkQuery = useQuery({
    queryKey: ['pk', 'active-for-host', session.hostId],
    queryFn: () => fetchActivePkForHost(session.hostId),
    staleTime: 15_000,
  });
  const activePk = pkQuery.data;

  return (
    <PressableScale style={styles.card} scaleTo={0.97} onPress={onPress}>
      {activePk ? (
        <View style={styles.pkSplitRow}>
          <View style={styles.pkSplitHalf}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} />
            ) : (
              <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            )}
          </View>
          <View style={styles.pkSplitHalf}>
            <LinearGradient
              colors={gradientForId(activePk.opponentId)}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
          <View style={styles.vsBadge}>
            <Text style={styles.vsBadgeText}>VS</Text>
          </View>
        </View>
      ) : thumbnail ? (
        <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.initialWrap} pointerEvents="none">
            <Text style={styles.initialText}>{initial}</Text>
          </View>
        </>
      )}

      <View style={styles.topRow}>
        <LiveBadge size="sm" />
        <View style={styles.elapsedPill}>
          <Text style={styles.elapsedText}>{elapsed}</Text>
        </View>
      </View>
      {session.category && (
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {session.category}
          </Text>
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(8,4,20,0.9)']} style={styles.scrim} />
      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={1}>
          {session.title}
        </Text>
        <View style={styles.hostRow}>
          <Text style={styles.hostName} numberOfLines={1}>
            {session.hostDisplayName ?? 'Unnamed host'}
          </Text>
          <Text style={styles.flag}>{countryCodeToFlag(session.countryCode)}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  initialWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontSize: 64, fontWeight: '900', color: 'rgba(255,255,255,0.35)' },
  card: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pkSplitRow: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  pkSplitHalf: { flex: 1, overflow: 'hidden' },
  vsBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -16,
    marginTop: -10,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  vsBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  topRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  elapsedPill: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  elapsedText: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
  categoryPill: {
    position: 'absolute',
    top: 36,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: '80%',
  },
  categoryText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  footer: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
  },
  title: { color: colors.textPrimary, fontWeight: '800', fontSize: 13 },
  hostRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  hostName: { flex: 1, color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  flag: { fontSize: 13 },
});
