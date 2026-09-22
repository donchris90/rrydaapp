import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '../api/social';
import { fetchProfile } from '../api/profiles';
import { useProfileSheet } from '../context/ProfileSheetContext';
import { Avatar } from './Avatar';
import { colors, spacing, radii, type } from '../theme';

function useElapsedTime(startedAt: string | null): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!startedAt) return '0:00';
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Matches the reference app's top-left header — host avatar, name, a real
// follow toggle, and real elapsed live time — plus a close button on the
// right. Deliberately omits the reference's "Hour 100+" streak badge and
// percentage/level indicators: those need a hosting-hours/leveling system
// that doesn't exist on the backend, and a fabricated number there would
// look real without being real. Only rendering what's actually true.
export function LiveHeaderBar({
  hostId,
  hostName,
  startedAt,
  isOwnSession,
  onClose,
  onAvatarPosition,
}: {
  hostId: string;
  hostName: string;
  startedAt: string | null;
  isOwnSession: boolean;
  onClose: () => void;
  // Where the host's photo is on screen (window coordinates), so a gift can fly to it.
  onAvatarPosition?: (p: { x: number; y: number }) => void;
}) {
  const queryClient = useQueryClient();
  const elapsed = useElapsedTime(startedAt);

  // The host's real name and photo (the header used to show the stream's TITLE as
  // the name). Also tells us whether you already follow them.
  const profileQuery = useQuery({ queryKey: ['profile', hostId], queryFn: () => fetchProfile(hostId), enabled: !!hostId, retry: false });
  const isFollowing = profileQuery.data?.isFollowing ?? false;
  const displayName = profileQuery.data?.displayName ?? hostName;
  const profileSheet = useProfileSheet();
  const avatarRef = React.useRef<View>(null);

  const followMutation = useMutation({
    mutationFn: () => (isFollowing ? unfollowUser(hostId) : followUser(hostId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', hostId] });
      queryClient.invalidateQueries({ queryKey: ['social'] });
    },
    onError: () => {
      Alert.alert('Something went wrong', 'Could not update follow status. Try again.');
    },
  });

  return (
    <View style={styles.container}>
      {/* Tap the host (photo or name) to see their profile and follow them. */}
      <Pressable style={styles.hostTap} onPress={() => profileSheet.open(hostId)} accessibilityLabel={`${displayName}'s profile`}>
        <View
          ref={avatarRef}
          collapsable={false}
          onLayout={() => avatarRef.current?.measureInWindow((x, y, w, h) => onAvatarPosition?.({ x: x + w / 2, y: y + h / 2 }))}
        >
          <Avatar name={displayName} size={36} imageUrl={profileQuery.data?.avatarUrl} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.elapsed}>{elapsed}</Text>
        </View>
      </Pressable>

      {!isOwnSession && (
        <Pressable
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => followMutation.mutate()}
          disabled={followMutation.isPending}
        >
          <Ionicons name={isFollowing ? 'checkmark' : 'add'} size={16} color={colors.textPrimary} />
        </Pressable>
      )}

      <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
        <Ionicons name="close" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hostTap: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  info: { flex: 1 },
  name: { ...type.bodyStrong, color: colors.textPrimary, maxWidth: 160 },
  elapsed: { ...type.caption, color: colors.textSecondary },
  followButton: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: { backgroundColor: colors.surface },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
