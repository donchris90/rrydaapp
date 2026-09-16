import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConversation, sendDirectMessage, markConversationRead, type DirectMessage } from '../../api/messages';
import { initiateCall } from '../../api/calls';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { colors, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type ConversationRouteProp = RouteProp<AppStackParamList, 'Conversation'>;

// Real messages, real send, real read receipts — polled every 3s rather
// than push-delivered. True real-time delivery would need a user-
// presence/socket-mapping layer this backend's realtime gateway doesn't
// have yet (it tracks room/live *contexts* to join, not "which socket
// belongs to which user" globally, which direct messaging actually
// needs). A real, working v1, with an honest limit — not hidden.
export function ConversationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<ConversationRouteProp>();
  const { userId, displayName } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const conversationQuery = useQuery({
    queryKey: ['messages', 'with', userId],
    queryFn: () => fetchConversation(userId),
    refetchInterval: 3000,
  });

  useEffect(() => {
    markConversationRead(userId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  }, [userId]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendDirectMessage(userId, content),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messages', 'with', userId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });

  const callMutation = useMutation({
    mutationFn: () => initiateCall(userId),
    onSuccess: (call) => {
      navigation.navigate('Call', { callId: call.id, otherUserId: userId, otherUserDisplayName: displayName, isIncoming: false });
    },
  });

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{displayName ?? 'User'}</Text>
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
            onChangeText={setDraft}
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
  title: { ...type.h2, color: colors.textPrimary, flex: 1 },
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
