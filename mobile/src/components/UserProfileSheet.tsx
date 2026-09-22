import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, recordProfileView } from '../api/profiles';
import { followUser, unfollowUser } from '../api/social';
import { countryCodeToFlag } from '../utils/country';
import { Avatar } from './Avatar';

const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n));

// A person's profile card: photo, name, followers, a Follow button, Message, and
// "Watch live" when they are broadcasting. Opening someone else's card lets them
// know (an inbox item, once a day per visitor).
export function UserProfileSheet({ userId, visible, onClose }: { userId: string | null; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({ queryKey: ['profile', userId], queryFn: () => fetchProfile(userId!), enabled: visible && !!userId, retry: false });
  const profile = profileQuery.data;

  // Once per opening, and only for someone else's profile.
  const notified = useRef<string | null>(null);
  useEffect(() => {
    if (!visible) {
      notified.current = null;
      return;
    }
    if (profile && !profile.isMe && notified.current !== profile.id) {
      notified.current = profile.id;
      recordProfileView(profile.id).catch(() => {});
    }
  }, [visible, profile]);

  const follow = useMutation({
    mutationFn: () => (profile?.isFollowing ? unfollowUser(userId!) : followUser(userId!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['social'] });
    },
    onError: (e: any) => Alert.alert('Could not update', e?.response?.data?.message ?? 'Please try again.'),
  });

  if (!visible) return null;

  const go = (name: string, params: Record<string, unknown>) => {
    onClose();
    navigation.navigate(name, params);
  };

  return (
    // Above every other in-screen layer (gift panel, tools sheet, chat).
    <View style={[StyleSheet.absoluteFill, { zIndex: 2000, elevation: 2000 }]}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          {profileQuery.isLoading ? (
            <ActivityIndicator color="#FF4D8D" style={{ marginVertical: 40 }} />
          ) : profileQuery.isError || !profile ? (
            <Text style={styles.unavailable}>This profile isn't available.</Text>
          ) : (
            <>
              <View style={styles.avatarWrap}>
                <Avatar name={profile.displayName} size={88} imageUrl={profile.avatarUrl} ring={!!profile.live} />
                {profile.live && (
                  <View style={styles.liveChip}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
              </View>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.displayName ?? 'Unnamed user'}
                </Text>
                {profile.verified && <Ionicons name="shield-checkmark" size={16} color="#3DF5A0" />}
                <Text style={styles.flag}>{countryCodeToFlag(profile.countryCode)}</Text>
              </View>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{compact(profile.followerCount)}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{compact(profile.followingCount)}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>

              {profile.isMe ? (
                <Pressable style={[styles.button, styles.secondary]} onPress={() => go('EditProfile', {})}>
                  <Text style={styles.secondaryText}>Edit profile</Text>
                </Pressable>
              ) : (
                <View style={styles.actions}>
                  <Pressable style={[styles.button, profile.isFollowing ? styles.secondary : styles.primary, { flex: 1 }]} onPress={() => follow.mutate()} disabled={follow.isPending}>
                    <Ionicons name={profile.isFollowing ? 'checkmark' : 'add'} size={18} color="#FFF" />
                    <Text style={styles.primaryText}>{profile.isFollowing ? 'Following' : 'Follow'}</Text>
                  </Pressable>
                  <Pressable style={[styles.button, styles.secondary, { flex: 1 }]} onPress={() => go('Conversation', { userId: profile.id, displayName: profile.displayName })}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
                    <Text style={styles.primaryText}>Message</Text>
                  </Pressable>
                </View>
              )}
              {!profile.isMe && profile.live && (
                <Pressable style={[styles.button, styles.watch]} onPress={() => go('LiveViewer', { sessionId: profile.live!.sessionId })}>
                  <Ionicons name="play" size={16} color="#FFF" />
                  <Text style={styles.primaryText} numberOfLines={1}>
                    Watch live
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#1B1430', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, alignItems: 'stretch' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 16 },
  unavailable: { color: '#FFF', textAlign: 'center', marginVertical: 40, fontSize: 14 },
  avatarWrap: { alignSelf: 'center', marginBottom: 10 },
  liveChip: { position: 'absolute', bottom: -6, alignSelf: 'center', backgroundColor: '#FF2E7E', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  name: { color: '#FFF', fontSize: 20, fontWeight: '900', maxWidth: '70%' },
  flag: { fontSize: 16 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  stat: { alignItems: 'center', paddingHorizontal: 30 },
  statNumber: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 23 },
  primary: { backgroundColor: '#FF2E7E' },
  secondary: { backgroundColor: 'rgba(255,255,255,0.14)' },
  watch: { backgroundColor: '#7B42F6', marginTop: 10 },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  secondaryText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
});
