import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import type { ChatMessage } from '../live/useLiveChat';
import { colors, spacing, radii, type } from '../theme';

// Redesigned to match Facebook/Instagram Live's actual chat style: each
// comment is its own small translucent pill floating directly over the
// video — no boxed panel behind the whole feed, no distinct border
// around the list, no colorful gradient sender badges. Name and message
// sit in one compact line per comment, which is what reads as "ambient
// overlay" rather than "a chat app window sitting on top of the video".
//
// Takes messages/sendMessage as props rather than calling useLiveChat
// itself — the parent screen owns the one socket connection (it also
// needs giftEvents for GiftTicker), so this component must not open a
// second, independent connection to the same room.
export interface LiveChatFeedHandle {
  focus: () => void;
}

// forwardRef + an exposed focus() — added so the bottom action bar's chat
// icon can bring up the keyboard on this already-always-visible input,
// which is the one real thing left for that icon to do (there's no
// separate visibility to toggle; the input was already always shown).
export const LiveChatFeed = forwardRef<
  LiveChatFeedHandle,
  {
    messages: ChatMessage[];
    sendMessage: (content: string) => void;
    // Optional custom row renderer — added so screens like GoLiveScreen
    // can plug in their own styled line (e.g. AnimatedChatLine) using the
    // real message shape ({senderId, content, createdAt}), rather than
    // guessing at fields that don't exist on it (an earlier attempt at
    // this read message.username/message.text, neither of which is a
    // real field here, so it would have silently rendered "User" with
    // empty text for every message). Falls back to the default pill
    // rendering when not provided.
    renderLine?: (message: ChatMessage, isMe: boolean) => React.ReactNode;
  }
>(function LiveChatFeed({ messages, sendMessage, renderLine }, ref) {
    const { user } = useAuth();
    const [draft, setDraft] = useState('');
    const listRef = useRef<FlatList<ChatMessage>>(null);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.id;
    if (renderLine) return <>{renderLine(item, isMe)}</>;
    return (
      <View style={styles.messagePill}>
        <Text style={styles.messageText} numberOfLines={2}>
          <Text style={[styles.senderName, isMe && styles.senderNameMe]}>{isMe ? 'You' : item.senderId.slice(0, 6)}</Text>
          {'  '}
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.list}
        style={styles.feed}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Say something..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        {draft.trim().length > 0 && (
          <Pressable style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={16} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
  },
);

const styles = StyleSheet.create({
  container: { width: '100%' },
  feed: { maxHeight: 150 },
  list: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, justifyContent: 'flex-end' },
  messagePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 5,
    maxWidth: '92%',
  },
  messageText: { color: colors.textPrimary, fontSize: 13, lineHeight: 17 },
  senderName: { fontWeight: '700', color: '#BFD4FF' },
  senderNameMe: { color: colors.gold },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    color: colors.textPrimary,
    fontSize: 13,
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});