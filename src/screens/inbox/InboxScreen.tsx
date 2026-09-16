import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '../../api/notifications';
import { fetchConversations, type DmConversation } from '../../api/messages';
import { GradientBackground } from '../../components/GradientBackground';
import { FadeInUp } from '../../components/FadeInUp';
import { PressableScale } from '../../components/PressableScale';
import { Avatar } from '../../components/Avatar';
import { colors, gradients, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

// GET /api/v1/notifications existed and worked since early in this
// project, with a comment on the old placeholder version of this screen
// explicitly flagging it as real and unbuilt. This is that build —
// real list, real mark-as-read, real per-notification content (the
// backend now resolves a FOLLOW notification's raw followerId into an
// actual display name before this screen ever sees it, rather than this
// screen making its own follow-up lookup per row).
//
// Messages tab added alongside it — real 1-on-1 direct messaging, a
// genuinely new backend feature (DirectMessage model + real endpoints),
// not a re-skin of anything that already existed. Polled, not push-
// delivered — see ConversationScreen's own comment for why.
function describeNotification(n: AppNotification): string {
  if (n.type === 'FOLLOW') {
    const name = (n.payload as any)?.followerDisplayName;
    return name ? `${name} started following you` : 'Someone started following you';
  }
  if (n.type === 'MESSAGE') return 'New message';
  if (n.type === 'SECURITY') return 'Security alert on your account';
  return 'System notification';
}

function iconForType(n: AppNotification): React.ComponentProps<typeof Ionicons>['name'] {
  if (n.type === 'FOLLOW') return 'person-add';
  if (n.type === 'MESSAGE') return 'chatbubble';
  if (n.type === 'SECURITY') return 'shield-checkmark';
  return 'information-circle';
}

export function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(false),
    refetchInterval: 15000,
  });

  const conversationsQuery = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: fetchConversations,
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadNotifCount = notificationsQuery.data?.filter((n) => !n.read).length ?? 0;
  const unreadMsgCount = conversationsQuery.data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  const handleNotificationPress = (n: AppNotification) => {
    if (!n.read) markReadMutation.mutate(n.id);
    if (n.type === 'FOLLOW') {
      const followerId = (n.payload as any)?.followerId;
      // FollowList doesn't support opening a specific user's own
      // profile from here yet — a real, separate gap, not faked with a
      // navigation call to a screen that doesn't accept this param.
      if (followerId) navigation.navigate('FollowList', { mode: 'followers' });
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        {activeTab === 'notifications' && unreadNotifCount > 0 && (
          <Pressable onPress={() => markAllReadMutation.mutate()}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.tabRow}>
        <Pressable style={styles.tabButton} onPress={() => setActiveTab('notifications')}>
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Notifications{unreadNotifCount > 0 ? ` (${unreadNotifCount})` : ''}
          </Text>
          {activeTab === 'notifications' && <View style={styles.tabUnderline} />}
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => setActiveTab('messages')}>
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Messages{unreadMsgCount > 0 ? ` (${unreadMsgCount})` : ''}
          </Text>
          {activeTab === 'messages' && <View style={styles.tabUnderline} />}
        </Pressable>
      </View>

      {activeTab === 'notifications' ? (
        notificationsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (notificationsQuery.data ?? []).length === 0 ? (
          <EmptyState icon="notifications" title="No notifications yet" subtitle="Follows and alerts will land here" />
        ) : (
          <FlatList
            data={notificationsQuery.data ?? []}
            keyExtractor={(n) => n.id}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <FadeInUp index={index}>
                <PressableScale
                  style={[styles.row, !item.read && styles.rowUnread]}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View style={styles.rowIconWrap}>
                    <Ionicons name={iconForType(item)} size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowText}>{describeNotification(item)}</Text>
                    <Text style={styles.rowTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </PressableScale>
              </FadeInUp>
            )}
          />
        )
      ) : conversationsQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (conversationsQuery.data ?? []).length === 0 ? (
        <EmptyState icon="chatbubble-ellipses" title="No messages yet" subtitle="Conversations will land here" />
      ) : (
        <FlatList
          data={conversationsQuery.data ?? []}
          keyExtractor={(c) => c.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <FadeInUp index={index}>
              <PressableScale
                style={styles.row}
                onPress={() => navigation.navigate('Conversation', { userId: item.userId, displayName: item.displayName })}
              >
                <Avatar name={item.displayName} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowText} numberOfLines={1}>{item.displayName ?? 'User'}</Text>
                  <Text style={styles.rowSubtext} numberOfLines={1}>
                    {item.lastMessageIsMine ? 'You: ' : ''}
                    {item.lastMessage}
                  </Text>
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.msgBadge}>
                    <Text style={styles.msgBadgeText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
                  </View>
                )}
              </PressableScale>
            </FadeInUp>
          )}
        />
      )}
    </GradientBackground>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptyWrap}>
      <FadeInUp index={0} style={styles.iconWrap}>
        <LinearGradient colors={gradients.gold} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={icon} size={30} color={colors.textOnLight} />
        </LinearGradient>
      </FadeInUp>
      <FadeInUp index={1}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </FadeInUp>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...type.display, color: colors.textPrimary },
  markAllText: { ...type.caption, color: colors.primary, fontWeight: '700' },
  tabRow: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  tabButton: { alignItems: 'center' },
  tabText: { ...type.body, color: colors.textMuted, fontWeight: '700' },
  tabTextActive: { color: colors.textPrimary },
  tabUnderline: { marginTop: 4, width: 20, height: 3, borderRadius: 2, backgroundColor: colors.primary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconWrap: { marginBottom: spacing.md },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.h2, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
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
  rowUnread: { borderColor: colors.primary },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { ...type.body, color: colors.textPrimary },
  rowSubtext: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  rowTime: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  msgBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
});
