import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FeedUser } from '../api/types';
import { countryCodeToFlag } from '../utils/country';
import { Avatar } from './Avatar';
import { LiveBadge } from './LiveBadge';
import { PressableScale } from './PressableScale';
import { colors, spacing, type } from '../theme';

export function UserListRow({ user }: { user: FeedUser }) {
  return (
    <PressableScale style={styles.row} scaleTo={0.98}>
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
