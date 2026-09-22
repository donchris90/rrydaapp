import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { acceptPk, declinePk, type PkBattle } from '../api/pk';
import { fetchProfile } from '../api/profiles';
import { Avatar } from './Avatar';

// The route currently on screen, however deeply nested.
function focusedRouteName(state: any): string | undefined {
  let s = state;
  while (s?.routes?.[s.index ?? 0]?.state) s = s.routes[s.index ?? 0].state;
  return s?.routes?.[s.index ?? (s.routes?.length ?? 1) - 1]?.name;
}

// Accepting / declining a challenge, shared by the on-screen banner, the PK sheet
// and the PK screen so they all behave the same.
export function usePkChallengeActions(onDone?: () => void) {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pk'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const accept = useMutation({
    mutationFn: (battleId: string) => acceptPk(battleId),
    onSuccess: () => {
      refresh();
      onDone?.();
      // A PK is played from a live: take them there unless they are already in one.
      if (focusedRouteName(navigation.getState?.()) !== 'GoLive') navigation.navigate('GoLive');
    },
    onError: (e: any) => Alert.alert('Could not accept', e?.response?.data?.message ?? 'Something went wrong'),
  });

  const decline = useMutation({
    mutationFn: (battleId: string) => declinePk(battleId),
    onSuccess: () => {
      refresh();
      onDone?.();
    },
    onError: (e: any) => Alert.alert('Could not decline', e?.response?.data?.message ?? 'Something went wrong'),
  });

  return { accept, decline };
}

// One "Ada wants to PK" row with Decline / Accept.
export function IncomingChallengeRow({ battle, onDone }: { battle: PkBattle; onDone?: () => void }) {
  const profile = useQuery({ queryKey: ['profile', battle.challengerId], queryFn: () => fetchProfile(battle.challengerId), retry: false });
  const { accept, decline } = usePkChallengeActions(onDone);
  const busy = accept.isPending || decline.isPending;
  const name = profile.data?.displayName ?? 'A creator';
  return (
    <View style={styles.row}>
      <Avatar name={name} size={38} imageUrl={profile.data?.avatarUrl} />
      <Text style={styles.text} numberOfLines={1}>
        {name} challenges you
      </Text>
      <Pressable style={[styles.btn, styles.decline]} onPress={() => decline.mutate(battle.id)} disabled={busy}>
        <Text style={styles.btnText}>Decline</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.accept]} onPress={() => accept.mutate(battle.id)} disabled={busy}>
        {accept.isPending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.btnText}>Accept</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  text: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700' },
  btn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, minWidth: 66, alignItems: 'center' },
  decline: { backgroundColor: 'rgba(255,255,255,0.16)' },
  accept: { backgroundColor: '#FF2E7E' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
});
