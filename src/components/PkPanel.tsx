import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLiveNow } from '../api/live';
import { challengePk, acceptPk, fetchPk, fetchIncomingPk } from '../api/pk';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import { PressableScale } from './PressableScale';
import { colors, spacing, radii, type, glow } from '../theme';

// No matchmaking/random-opponent queue exists on the backend — only a
// direct "challenge this specific person" flow is real. The reference
// app's Random PK / Team PK modes and the odds wheel aren't backed by
// anything here; this deliberately only builds what challenge()/accept()
// actually support.
export function PkPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);

  const incomingQuery = useQuery({
    queryKey: ['pk', 'incoming'],
    queryFn: fetchIncomingPk,
    refetchInterval: 5000,
    enabled: !activeBattleId, // no need to keep polling for new challenges once already in one
  });

  const liveHostsQuery = useQuery({
    queryKey: ['feed', 'live-now'],
    queryFn: fetchLiveNow,
    enabled: isSheetOpen,
  });

  const battleQuery = useQuery({
    queryKey: ['pk', 'battle', activeBattleId],
    queryFn: () => fetchPk(activeBattleId!),
    enabled: !!activeBattleId,
    refetchInterval: (query) => (query.state.data?.status === 'SETTLED' ? false : 3000),
  });

  // Once settled, surface the result briefly then clear — polling a
  // finished battle forever would be pointless, and the scoreboard
  // shouldn't linger indefinitely over the video.
  useEffect(() => {
    if (battleQuery.data?.status === 'SETTLED') {
      const timeout = setTimeout(() => setActiveBattleId(null), 6000);
      return () => clearTimeout(timeout);
    }
  }, [battleQuery.data?.status]);

  const challengeMutation = useMutation({
    mutationFn: (opponentId: string) => challengePk(opponentId),
    onSuccess: (battle) => {
      setIsSheetOpen(false);
      setActiveBattleId(battle.id);
    },
    onError: (error: any) => {
      Alert.alert('Could not send challenge', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (battleId: string) => acceptPk(battleId),
    onSuccess: (battle) => {
      setIsSheetOpen(false);
      setActiveBattleId(battle.id);
      queryClient.invalidateQueries({ queryKey: ['pk', 'incoming'] });
    },
    onError: (error: any) => {
      Alert.alert('Could not accept challenge', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const battle = battleQuery.data;
  const incomingCount = incomingQuery.data?.length ?? 0;

  // Live battle scoreboard replaces the plain PK button once one exists —
  // this is deliberately the more prominent state, matching how central
  // PK is in the reference app's live overlay once it's actually running.
  if (battle && battle.status !== 'CANCELLED') {
    const isChallenger = battle.challengerId === user?.id;
    const myScore = isChallenger ? battle.scoreChallenger : battle.scoreOpponent;
    const theirScore = isChallenger ? battle.scoreOpponent : battle.scoreChallenger;

    return (
      <View style={[styles.battleBar, glow.pink]}>
        <Text style={styles.battleScore}>{myScore}</Text>
        <View style={styles.battleMiddle}>
          <Text style={styles.battleStatus}>
            {battle.status === 'COUNTDOWN' && 'Starting...'}
            {battle.status === 'ACTIVE' && 'PK LIVE'}
            {battle.status === 'SETTLED' &&
              (battle.winnerId == null ? 'Draw' : battle.winnerId === user?.id ? 'You won!' : 'Opponent won')}
          </Text>
        </View>
        <Text style={styles.battleScore}>{theirScore}</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable style={styles.pkButton} onPress={() => setIsSheetOpen(true)}>
        <Ionicons name="flash" size={16} color={colors.textPrimary} />
        {incomingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{incomingCount}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={isSheetOpen} transparent animationType="slide" onRequestClose={() => setIsSheetOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>PK</Text>

            {incomingCount > 0 && (
              <>
                <Text style={styles.sectionLabel}>Challenging you</Text>
                <FlatList
                  data={incomingQuery.data}
                  keyExtractor={(b) => b.id}
                  renderItem={({ item }) => (
                    <View style={styles.incomingRow}>
                      <Text style={styles.incomingText} numberOfLines={1}>
                        A host wants to PK
                      </Text>
                      <PressableScale
                        style={styles.acceptButton}
                        onPress={() => acceptMutation.mutate(item.id)}
                        disabled={acceptMutation.isPending}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </PressableScale>
                    </View>
                  )}
                />
              </>
            )}

            <Text style={styles.sectionLabel}>Challenge a live host</Text>
            {liveHostsQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : (
              <FlatList
                data={(liveHostsQuery.data ?? []).filter((s) => s.hostId !== user?.id)}
                keyExtractor={(s) => s.id}
                renderItem={({ item }) => (
                  <PressableScale
                    style={styles.hostRow}
                    onPress={() => challengeMutation.mutate(item.hostId)}
                    disabled={challengeMutation.isPending}
                  >
                    <Avatar name={item.hostDisplayName} size={36} />
                    <Text style={styles.hostName} numberOfLines={1}>
                      {item.hostDisplayName ?? 'Unnamed host'}
                    </Text>
                    <Ionicons name="flash-outline" size={18} color={colors.pink} />
                  </PressableScale>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No other hosts are live right now.</Text>}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pkButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.textOnLight, fontSize: 10, fontWeight: '800' },
  battleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  battleScore: { ...type.bodyStrong, color: colors.textPrimary },
  battleMiddle: { paddingHorizontal: spacing.sm },
  battleStatus: { ...type.caption, color: colors.pink, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    maxHeight: '70%',
  },
  sheetTitle: { ...type.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  sectionLabel: { ...type.caption, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  incomingText: { ...type.body, color: colors.textPrimary, flex: 1 },
  acceptButton: { backgroundColor: colors.pink, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  acceptButtonText: { ...type.caption, color: colors.textPrimary, fontWeight: '800' },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hostName: { ...type.body, color: colors.textPrimary, flex: 1 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});
