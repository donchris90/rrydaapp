import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConversation, sendDirectMessage, markConversationRead, type DirectMessage } from '../../api/messages';
import { initiateCall } from '../../api/calls';
import { useAuth } from '../../auth/AuthContext';
import { useDmTyping } from '../../live/useDmTyping';
import { GradientBackground } from '../../components/GradientBackground';
import { colors, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type ConversationRouteProp = RouteProp<AppStackParamList, 'Conversation'>;

// Real messages, real send, real read receipts. New messages arrive as
// 'dm:message' pushes, written into this query's cache by the app-wide
// useDirectMessagePush listener; the 30s poll below is only a fallback for
// a socket that dropped without noticing.
export function ConversationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<ConversationRouteProp>();
  const { userId, displayName } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<DirectMessage>>(null);
  const { isOtherTyping, notifyTyping, stopTyping } = useDmTyping(userId);

  const conversationQuery = useQuery({
    queryKey: ['messages', 'with', userId],
    queryFn: () => fetchConversation(userId),
    refetchInterval: 30000,
  });

  useEffect(() => {
    markConversationRead(userId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  }, [userId]);

  // A message that lands while this screen is open is read the moment it
  // arrives. Guarded by the last message id already marked, since the
  // cached copy stays `read: false` until the next refetch.
  const lastMarkedRef = useRef<string | null>(null);
  useEffect(() => {
    const incomingUnread = (conversationQuery.data ?? []).filter((m) => m.senderId === userId && !m.read);
    const latest = incomingUnread[incomingUnread.length - 1];
    if (!latest || latest.id === lastMarkedRef.current) return;
    lastMarkedRef.current = latest.id;
    markConversationRead(userId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  }, [conversationQuery.data, userId]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendDirectMessage(userId, content),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messages', 'with', userId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
    // Sends used to fail silently. The server's message ("You can't message
    // this user" when a block exists) is shown as-is; the draft is kept so
    // nothing typed is lost.
    onError: (error: any) => {
      Alert.alert("Couldn't send", error?.response?.data?.message ?? 'Please try again.');
    },
  });

  const callMutation = useMutation({
    mutationFn: () => initiateCall(userId),
    onSuccess: (call) => {
      navigation.navigate('Call', { callId: call.id, otherUserId: userId, otherUserDisplayName: displayName, isIncoming: false });
    },
    onError: (error: any) => {
      Alert.alert("Couldn't start the call", error?.response?.data?.message ?? 'Please try again.');
    },
  });

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    stopTyping();
    sendMutation.mutate(trimmed);
  };

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{displayName ?? 'User'}</Text>
          {isOtherTyping && <Text style={styles.typingText}>typing…</Text>}
        </View>
        <Pressable onPress={() => callMutation.mutate()} hitSlop={12} style={styles.callButton} disabled={callMutation.isPending}>
          <Ionicons name="videocam" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={conversationQuery.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !conversationQuery.isLoading ? (
              <Text style={styles.emptyText}>Say hello — no messages yet.</Text>
            ) : null
          }
        />

        <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              notifyTyping(text.trim().length > 0);
            }}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable style={styles.sendButton} onPress={handleSend} disabled={!draft.trim() || sendMutation.isPending}>
            <Ionicons name="send" size={18} color={draft.trim() ? '#FFF' : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: { padding: spacing.xs },
  callButton: { padding: spacing.xs },
  title: { ...type.h2, color: colors.textPrimary },
  typingText: { ...type.caption, color: colors.primary },
  list: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6, flexGrow: 1 },
  emptyText: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: radii.lg, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderBottomLeftRadius: 4 },
  bubbleText: { ...type.body, color: colors.textPrimary },
  bubbleTextMine: { color: '#FFF' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
