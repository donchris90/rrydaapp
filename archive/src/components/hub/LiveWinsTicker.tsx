import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveWins } from '../../api/games';
import { hubColors, hubTint } from '../../theme';
import { PressableScale } from '../PressableScale';

const GAME_ICON: Record<string, string> = {
  CRASH: '🚀',
  SUM_DICE: '🎲',
};

// Ports the reference's "Live Big Wins" ticker — but rotates through real
// recent GameEntry.WON rows (GET /games/live-wins) instead of the
// reference's 5-item fake WINNERS array. Polls rather than sockets for
// now, same "good enough for a ticker, not pretending to be a trading
// feed" tradeoff as HomeScreen's 6s live-now poll.
export function LiveWinsTicker({ onOpenProfile }: { onOpenProfile: () => void }) {
  const winsQuery = useQuery({
    queryKey: ['games', 'live-wins'],
    queryFn: fetchLiveWins,
    refetchInterval: 8000,
  });

  const wins = winsQuery.data ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (wins.length < 2) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % wins.length), 3200);
    return () => clearInterval(timer);
  }, [wins.length]);

  const current = wins.length > 0 ? wins[index % wins.length] : null;

  return (
    <View style={styles.bar}>
      <View style={styles.labelGroup}>
        <Ionicons name="trophy" size={13} color={hubColors.amber400} />
        <Text style={styles.label}>Live Big Wins</Text>
      </View>

      <View style={styles.contentGroup}>
        {current ? (
          <>
            <Text style={styles.icon}>{GAME_ICON[current.gameCode ?? ''] ?? '🎮'}</Text>
            <Text style={styles.username} numberOfLines={1}>
              {current.displayName ?? 'A player'}
            </Text>
            <Text style={styles.won}>won</Text>
            <Text style={styles.amount}>+{current.rewardAmount.toLocaleString()}</Text>
            {current.multiplier > 0 && (
              <View style={styles.multiplierChip}>
                <Text style={styles.multiplierText}>{current.multiplier}x</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.idleText}>
            {winsQuery.isLoading ? 'Loading recent wins…' : 'No big wins yet — be the first!'}
          </Text>
        )}
      </View>

      <View style={styles.rightGroup}>
        <View style={styles.liveDot} />
        <PressableScale onPress={onOpenProfile} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>My Profile</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: hubColors.panelAlt,
    borderWidth: 1,
    borderColor: hubColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  label: { color: hubColors.textFaint, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  contentGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 8 },
  icon: { fontSize: 15 },
  username: { color: hubColors.textFaint, fontWeight: '700', fontSize: 12, flexShrink: 1 },
  won: { color: hubColors.textSecondary, fontSize: 12 },
  amount: { color: hubColors.emerald400, fontWeight: '800', fontSize: 12 },
  multiplierChip: {
    backgroundColor: hubTint.emerald20,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  multiplierText: { color: hubColors.emerald300, fontSize: 10, fontWeight: '900' },
  idleText: { color: hubColors.textMuted, fontSize: 12 },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: hubColors.emerald400 },
  profileButton: {
    backgroundColor: hubColors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  profileButtonText: { color: hubColors.amber300, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
});
