import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchIncomingPk, type PkBattle } from '../api/pk';
import { fetchProfile } from '../api/profiles';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import { usePkChallengeActions } from './PkIncoming';

const AUTO_HIDE_MS = 30_000;

// When someone challenges you to a PK it appears ON SCREEN, wherever you are in the
// app — including in the middle of your own live — with Accept and Decline.
// (Before, the only sign was an inbox item.) The server sends the challenge to your
// phone the moment it is made; a slow poll is the fallback if the connection drops.
// Ignoring it for 30 seconds just hides the banner: the challenge stays in your
// inbox and the PK sheet until you answer it.
export function PkChallengeBanner() {
  const { isAuthenticated } = useAuth();
  const [hidden, setHidden] = useState<string[]>([]);
  const query = useQuery({ queryKey: ['pk', 'incoming'], queryFn: fetchIncomingPk, enabled: isAuthenticated, refetchInterval: 10_000 });
  const next = (query.data ?? []).find((b) => !hidden.includes(b.id));

  useEffect(() => {
    if (!next) return;
    const t = setTimeout(() => setHidden((h) => [...h, next.id]), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [next?.id]);

  if (!isAuthenticated || !next) return null;
  return <Card key={next.id} battle={next} onHide={() => setHidden((h) => [...h, next.id])} />;
}

function Card({ battle, onHide }: { battle: PkBattle; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  const profile = useQuery({ queryKey: ['profile', battle.challengerId], queryFn: () => fetchProfile(battle.challengerId), retry: false });
  const { accept, decline } = usePkChallengeActions(onHide);
  const slide = useRef(new Animated.Value(-140)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  }, [slide]);
  const name = profile.data?.displayName ?? 'A creator';
  const busy = accept.isPending || decline.isPending;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 3000, elevation: 3000 }]} pointerEvents="box-none">
      <Animated.View style={[styles.card, { top: insets.top + 8, transform: [{ translateY: slide }] }]}>
        <View style={styles.head}>
          <Avatar name={name} size={44} imageUrl={profile.data?.avatarUrl} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.sub}>challenges you to a PK battle</Text>
          </View>
          <Ionicons name="flash" size={22} color="#FFC24B" />
        </View>
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.decline]} onPress={() => decline.mutate(battle.id)} disabled={busy}>
            <Text style={styles.btnText}>Decline</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.accept]} onPress={() => accept.mutate(battle.id)} disabled={busy}>
            <Text style={styles.btnText}>{accept.isPending ? 'Accepting…' : 'Accept'}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 12, right: 12, backgroundColor: 'rgba(27,20,48,0.97)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,46,126,0.6)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  decline: { backgroundColor: 'rgba(255,255,255,0.14)' },
  accept: { backgroundColor: '#FF2E7E' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});
