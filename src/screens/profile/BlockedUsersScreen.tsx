import React from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBlockedUsers, unblockUser, type BlockedUser } from '../../api/social';
import { GradientBackground } from '../../components/GradientBackground';
import { Avatar } from '../../components/Avatar';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// block()/unblock() existed and worked in social.service.ts since early
// in this project — nothing ever let a user actually see who they'd
// blocked. Real list, real unblock, using the endpoint added specifically
// to close that gap.
export function BlockedUsersScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const blockedQuery = useQuery({ queryKey: ['social', 'blocked'], queryFn: fetchBlockedUsers });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social', 'blocked'] }),
    onError: (error: any) => Alert.alert('Could not unblock', error?.response?.data?.message ?? 'Something went wrong'),
  });

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert('Unblock', `Unblock ${user.displayName ?? 'this user'}? They'll be able to follow and message you again.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unblock', style: 'destructive', onPress: () => unblockMutation.mutate(user.userId) },
    ]);
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Blocked Users</Text>
      </View>

      {blockedQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (blockedQuery.data ?? []).length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="shield-checkmark-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptySubtitle}>Anyone you block will show up here</Text>
        </View>
      ) : (
        <FlatList
          data={blockedQuery.data ?? []}
          keyExtractor={(u) => u.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <FadeInUp index={index} style={styles.row}>
              <Avatar name={item.displayName} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.displayName ?? 'User'}</Text>
                <Text style={styles.rowDate}>Blocked {new Date(item.blockedAt).toLocaleDateString()}</Text>
              </View>
              <Pressable
                style={styles.unblockButton}
                onPress={() => handleUnblock(item)}
                disabled={unblockMutation.isPending}
              >
                <Text style={styles.unblockText}>Unblock</Text>
              </Pressable>
            </FadeInUp>
          )}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { ...type.h2, color: colors.textPrimary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { ...type.h2, color: colors.textPrimary, marginTop: spacing.md },
  emptySubtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
  },
  rowName: { ...type.body, color: colors.textPrimary, fontWeight: '700' },
  rowDate: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  unblockButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  unblockText: { ...type.caption, color: colors.textPrimary, fontWeight: '700' },
});
