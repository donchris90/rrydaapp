import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProfileSheet } from '../context/ProfileSheetContext';
import type { FeedUser } from '../api/types';
import { countryCodeToFlag } from '../utils/country';
import { Avatar } from './Avatar';
import { LiveBadge } from './LiveBadge';
import { PressableScale } from './PressableScale';
import { colors, spacing, type } from '../theme';

// Tapping a person opens their profile card (follow, message, watch live); the chat
// icon jumps straight to a private conversation. (These rows used to do nothing.)
export function UserListRow({ user }: { user: FeedUser }) {
  const navigation = useNavigation<any>();
  const profileSheet = useProfileSheet();
  return (
    <PressableScale style={styles.row} scaleTo={0.98} onPress={() => profileSheet.open(user.id)}>
      <Avatar name={user.displayName} size={44} ring={user.isLive} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {user.displayName ?? 'Unnamed user'}
        </Text>
        <Text style={styles.flag}>
          {countryCodeToFlag(user.countryCode)} {user.countryCode}
        </Text>
      </View>
      {user.isLive && <LiveBadge size="sm" />}
      <Pressable hitSlop={10} onPress={() => navigation.navigate('Conversation', { userId: user.id, displayName: user.displayName })} accessibilityLabel="Send a message">
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
      </Pressable>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  text: { flex: 1 },
  name: { ...type.bodyStrong, color: colors.textPrimary },
  flag: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
});
