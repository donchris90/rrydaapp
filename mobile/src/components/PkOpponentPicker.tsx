import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { challengePk, fetchPkCandidates, randomPk, type PkCandidate, type PkCategory } from '../api/pk';
import { Avatar } from './Avatar';

const TABS: { key: PkCategory; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'friends', label: 'Friends', icon: 'people' },
  { key: 'agency', label: 'Agency', icon: 'briefcase' },
  { key: 'random', label: 'Random', icon: 'shuffle' },
];

const EMPTY: Record<PkCategory, string> = {
  friends: 'No friends are online right now. Friends are people you follow who follow you back.',
  agency: 'No one from your agency is online right now. Agency PK is for creators in the same agency.',
  random: 'No creators are online right now. Try again in a moment.',
};

// Choose who to challenge, in three groups — Friends, Agency, Random — and only
// people who are ONLINE right now (the list refreshes every 10 seconds).
export function PkOpponentPicker({ onChallenged }: { onChallenged?: () => void }) {
  const [category, setCategory] = useState<PkCategory>('friends');
  const query = useQuery({ queryKey: ['pk', 'candidates', category], queryFn: () => fetchPkCandidates(category), refetchInterval: 10_000 });

  const challenge = useMutation({
    mutationFn: (c: PkCandidate) => challengePk(c.userId),
    onSuccess: (_b, c) => {
      Alert.alert('Challenge sent', `${c.displayName ?? 'They'} will see it on their screen. The battle starts when they accept.`);
      onChallenged?.();
    },
    onError: (e: any) => Alert.alert('Could not send challenge', e?.response?.data?.message ?? 'Something went wrong'),
  });

  const random = useMutation({
    mutationFn: randomPk,
    onSuccess: (r) => {
      Alert.alert('Challenge sent', `${r.opponent.displayName ?? 'A creator'} was picked for you and will see it on their screen. The battle starts when they accept.`);
      onChallenged?.();
    },
    onError: (e: any) => Alert.alert('No match yet', e?.response?.data?.message ?? 'Something went wrong'),
  });

  const list = query.data?.candidates ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setCategory(t.key)} style={[styles.tab, category === t.key && styles.tabActive]}>
            <Ionicons name={t.icon} size={15} color={category === t.key ? '#FFF' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, category === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {category === 'random' && (
        <Pressable onPress={() => random.mutate()} disabled={random.isPending || list.length === 0}>
          <LinearGradient colors={['#FF5FA2', '#7B42F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.randomButton, (random.isPending || list.length === 0) && { opacity: 0.5 }]}>
            <Ionicons name="shuffle" size={18} color="#FFF" />
            <Text style={styles.randomText}>{random.isPending ? 'Finding someone…' : 'Find a random opponent'}</Text>
          </LinearGradient>
        </Pressable>
      )}

      <Text style={styles.count}>{query.isLoading ? 'Looking for people online…' : `${list.length} online now`}</Text>

      {query.isLoading ? (
        <ActivityIndicator color="#FF4D8D" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(c) => c.userId}
          ListEmptyComponent={<Text style={styles.empty}>{query.isError ? 'Could not load people. Pull back and try again.' : EMPTY[category]}</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Avatar name={item.displayName} size={42} imageUrl={item.avatarUrl} ring={!!item.live} />
                <View style={styles.onlineDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.displayName ?? 'Unnamed'}
                </Text>
                <Text style={styles.sub}>{item.live ? 'Live now' : 'Online'}</Text>
              </View>
              <Pressable style={styles.pkButton} onPress={() => challenge.mutate(item)} disabled={challenge.isPending}>
                <Ionicons name="flash" size={14} color="#FFF" />
                <Text style={styles.pkText}>PK</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.10)' },
  tabActive: { backgroundColor: '#FF2E7E' },
  tabText: { color: 'rgba(255,255,255,0.65)', fontWeight: '800', fontSize: 13 },
  tabTextActive: { color: '#FFF' },
  randomButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 23, marginBottom: 6 },
  randomText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  count: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginVertical: 8 },
  empty: { color: 'rgba(255,255,255,0.65)', textAlign: 'center', paddingVertical: 28, paddingHorizontal: 16, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  onlineDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#3DF5A0', borderWidth: 2, borderColor: '#1B1430' },
  name: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 1 },
  pkButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF2E7E', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  pkText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
});
