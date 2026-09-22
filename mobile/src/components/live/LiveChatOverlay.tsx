import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  badgeType?: 'vip' | 'mod' | 'fan' | 'system';
  level?: number;
  giftInfo?: {
    name: string;
    icon: string;
    count: number;
  };
}

interface LiveChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  // The screen provides its own input bar (see LiveBottomBar).
  hideInput?: boolean;
  onLikePress?: () => void;
  /** Host-only callback fired when a real user's chat identity is pressed. */
  onSenderPress?: (message: ChatMessage) => void;
  bottomInset: number;
}

const QUICK_EMOJIS = ['🔥', '❤️', '👏', '🚀', '💎', '🎉'];

export function LiveChatOverlay({
  messages,
  onSendMessage,
  hideInput,
  onLikePress,
  onSenderPress,
  bottomInset,
}: LiveChatOverlayProps) {
  const [inputText, setInputText] = useState('');
  const [isInputActive, setIsInputActive] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [unreadWhilePaused, setUnreadWhilePaused] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (autoScroll) {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
      setUnreadWhilePaused(0);
    } else {
      setUnreadWhilePaused((prev) => prev + 1);
    }
  }, [messages.length, autoScroll]);

  const handleSend = () => {
    if (inputText.trim().length === 0) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setIsInputActive(false);
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  const renderBadge = (item: ChatMessage) => {
    if (item.badgeType === 'system') {
      return (
        <View style={styles.systemBadge}>
          <Text style={styles.systemBadgeText}>SYS</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeRow}>
        {item.level != null && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{item.level}</Text>
          </View>
        )}
        {item.badgeType === 'vip' && (
          <View style={styles.vipBadge}>
            <Ionicons name="diamond" size={9} color="#FFD700" />
            <Text style={styles.vipText}>VIP</Text>
          </View>
        )}
        {item.badgeType === 'mod' && (
          <View style={styles.modBadge}>
            <Ionicons name="shield-checkmark" size={9} color="#FFF" />
            <Text style={styles.modText}>MOD</Text>
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.giftInfo) {
      return (
        <View style={styles.giftMessageCard}>
          <LinearGradient
            colors={['rgba(255, 61, 138, 0.35)', 'rgba(123, 77, 255, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.giftGradient}
          >
            <Text style={styles.giftSender}>{item.senderName}</Text>
            <Text style={styles.giftAction}>sent {item.giftInfo.name} </Text>
            <Text style={styles.giftIcon}>{item.giftInfo.icon}</Text>
            <Text style={styles.giftCombo}>x{item.giftInfo.count}</Text>
          </LinearGradient>
        </View>
      );
    }

    if (item.badgeType === 'system') {
      return (
        <View style={styles.systemMessageWrap}>
          <Ionicons name="notifications" size={11} color="#FFD700" />
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={styles.chatMessagePill}>
        <View style={styles.chatHeaderInline}>
          {renderBadge(item)}
          <Pressable
            onPress={() => onSenderPress?.(item)}
            onLongPress={() => onSenderPress?.(item)}
            delayLongPress={250}
            disabled={!onSenderPress || item.senderId === 'system'}
            hitSlop={4}
          >
            <Text style={styles.senderName}>{item.senderName}: </Text>
          </Pressable>
          <Text style={styles.chatBody}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { bottom: bottomInset + 56 }]}
    >
      {/* Auto-scroll Toggle Switch Bar */}
      <View style={styles.autoScrollHeaderRow}>
        <Pressable
          onPress={() => {
            const nextState = !autoScroll;
            setAutoScroll(nextState);
            if (nextState) {
              flatListRef.current?.scrollToEnd({ animated: true });
              setUnreadWhilePaused(0);
            }
          }}
          style={[
            styles.autoScrollToggleBtn,
            autoScroll ? styles.autoScrollOn : styles.autoScrollOff,
          ]}
        >
          <Ionicons
            name={autoScroll ? 'arrow-down-circle' : 'pause-circle'}
            size={12}
            color={autoScroll ? '#4ADE80' : '#FB7185'}
          />
          <Text style={styles.autoScrollLabel}>
            {autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: PAUSED'}
          </Text>
          <View
            style={[
              styles.autoScrollSwitchTrack,
              { backgroundColor: autoScroll ? '#22C55E' : '#475569' },
            ]}
          >
            <View
              style={[
                styles.autoScrollSwitchThumb,
                { alignSelf: autoScroll ? 'flex-end' : 'flex-start' },
              ]}
            />
          </View>
        </Pressable>

        {!autoScroll && unreadWhilePaused > 0 && (
          <Pressable
            onPress={() => {
              setAutoScroll(true);
              flatListRef.current?.scrollToEnd({ animated: true });
              setUnreadWhilePaused(0);
            }}
            style={styles.resumeScrollBadge}
          >
            <Ionicons name="arrow-down" size={10} color="#FFF" />
            <Text style={styles.resumeScrollText}>
              +{unreadWhilePaused} new • Tap to bottom
            </Text>
          </Pressable>
        )}
      </View>

      {/* Scrollable Chat Area */}
      <View style={styles.listWrapper}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
        />
      </View>

      {/* Floating Chat Input & Quick Reaction bar */}
      {!hideInput && (
      <View style={styles.inputBarRow}>
        {isInputActive ? (
          <View style={styles.activeInputWrap}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Send a comment..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              autoFocus
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable onPress={handleSend} style={styles.sendBtn}>
              <Ionicons name="send" size={16} color="#FFF" />
            </Pressable>
            <Pressable onPress={() => setIsInputActive(false)} style={styles.cancelBtn}>
              <Ionicons name="close" size={18} color="#AAA" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.inactiveRow}>
            <Pressable onPress={() => setIsInputActive(true)} style={styles.collapsedInputBtn}>
              <Ionicons name="chatbox-ellipses-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.collapsedPlaceholder}>Say something...</Text>
            </Pressable>

            {/* Quick reaction emojis */}
            <View style={styles.quickEmojisRow}>
              {QUICK_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleQuickEmoji(emoji)}
                  style={styles.emojiBtn}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 30,
    maxHeight: 280,
  },
  listWrapper: {
    maxHeight: 220,
  },
  listContent: {
    paddingVertical: 4,
    gap: 6,
    justifyContent: 'flex-end',
  },
  autoScrollHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  autoScrollToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
  },
  autoScrollOn: {
    backgroundColor: 'rgba(18, 12, 38, 0.75)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  autoScrollOff: {
    backgroundColor: 'rgba(38, 12, 24, 0.85)',
    borderColor: 'rgba(251, 113, 133, 0.5)',
  },
  autoScrollLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  autoScrollSwitchTrack: {
    width: 20,
    height: 11,
    borderRadius: 6,
    padding: 1.5,
    justifyContent: 'center',
  },
  autoScrollSwitchThumb: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  resumeScrollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2E7E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    shadowColor: '#FF2E7E',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeScrollText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatMessagePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(18, 12, 38, 0.65)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chatHeaderInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 5,
  },
  levelBadge: {
    backgroundColor: '#382B66',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  levelText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '800',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 0.8,
    borderColor: '#FFD700',
  },
  vipText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '800',
  },
  modBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#3DF5A0',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  modText: {
    color: '#F6F8FC',
    fontSize: 9,
    fontWeight: '800',
  },
  systemBadge: {
    backgroundColor: '#FF3B5C',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
  },
  systemBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  senderName: {
    color: '#B0A6D6',
    fontSize: 12,
    fontWeight: '700',
  },
  chatBody: {
    color: '#FFF',
    fontSize: 12,
    lineHeight: 16,
  },
  giftMessageCard: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    overflow: 'hidden',
    maxWidth: '90%',
  },
  giftGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 138, 0.4)',
  },
  giftSender: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  giftAction: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 3,
  },
  giftIcon: {
    fontSize: 14,
    marginHorizontal: 3,
  },
  giftCombo: {
    color: '#FF2E7E',
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  systemMessageWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 194, 75, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 75, 0.35)',
    maxWidth: '90%',
  },
  systemMessageText: {
    color: '#FFF',
    fontSize: 11,
    lineHeight: 15,
  },
  inputBarRow: {
    marginTop: 6,
  },
  inactiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collapsedInputBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 12, 38, 0.7)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  collapsedPlaceholder: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
  },
  quickEmojisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emojiBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 12, 38, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emojiText: {
    fontSize: 14,
  },
  activeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 16, 42, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF2E7E',
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    paddingVertical: 2,
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF2E7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    padding: 4,
  },
});
