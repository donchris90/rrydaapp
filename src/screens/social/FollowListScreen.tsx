import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchFollowersList, fetchFollowingList } from '../../api/social';
import { challengePk } from '../../api/pk';
import type { FeedUser } from '../../api/types';
import type { AppStackParamList } from '../../navigation/types';
import { GradientBackground } from '../../components/GradientBackground';
import { Avatar } from '../../components/Avatar';
import { colors, radii, spacing, type } from '../../theme';

export function FollowListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'FollowList'>>();
  const insets = useSafeAreaInsets();
  const { mode, pkChallenge } = route.params;

  const listQuery = useQuery({
    queryKey: ['social', mode],
    queryFn: mode === 'followers' ? fetchFollowersList : fetchFollowingList,
  });

  const challengeMutation = useMutation({
    mutationFn: (opponentId: string) => challengePk(opponentId),
    onSuccess: (battle) => {
      Alert.alert('Challenge sent', 'Waiting for them to accept.');
      // If a battle detail screen exists, navigate to it here:
      // navigation.navigate('PkBattle', { battleId: battle.id });
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert(
        'Could not send challenge',
        error?.response?.data?.message ?? 'Something went wrong. Try again.'
      );
    },
  });

  const handlePress = (user: FeedUser) => {
    if (pkChallenge) {
      Alert.alert(
        'Send PK challenge',
        `Challenge ${user.displayName ?? 'this user'} to a 1v1?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: () => challengeMutation.mutate(user.id),
          },
        ]
      );
      return;
    }
    // Standard behavior — no profile screen exists yet in this app, so
    // show an alert until one is added.
    Alert.alert('Profile', `Open ${user.displayName ?? 'user'}'s profile (not built yet)`);
  };

  return (
    <GradientBackground>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {pkChallenge ? 'Pick a PK opponent' : mode === 'followers' ? 'Followers' : 'Following'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={listQuery.data ?? []}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => handlePress(item)}
              disabled={challengeMutation.isPending}
            >
              <Avatar uri={undefined} size={44} />
              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.displayName ?? 'Anonymous'}
                </Text>
                <Text style={styles.rowSub}>{item.countryCode}</Text>
              </View>
              {pkChallenge ? (
                <View style={styles.pkTag}>
                  <Ionicons name="flash" size={14} color={colors.primary} />
                  <Text style={styles.pkTagText}>PK</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </Text>
          }
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    flex: 1,
    ...type.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowText: { flex: 1 },
  rowName: { ...type.bodyStrong, color: colors.textPrimary },
  rowSub: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  pkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pkTagText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  empty: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});