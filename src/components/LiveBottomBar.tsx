import React, { useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmojiPicker } from './EmojiPicker';

export interface LiveMenuItem {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  // Highlights the item (e.g. an active PK, a muted mic).
  active?: boolean;
  danger?: boolean;
}

interface Props {
  onSend: (text: string) => void;
  onGift: () => void;
  menuItems: LiveMenuItem[];
  placeholder?: string;
  bottomInset?: number;
}

// One bottom bar for hosts and viewers, in the layout people expect:
//   [ Say Hi...        ] [😊] [≡] [🎁]
// The comment box takes the space; emoji, a menu of everything else, and the gift
// button sit to its right. (The host used to have six loose buttons with no
// comment box, and viewers a comment box stacked over a second row of buttons.)
export function LiveBottomBar({ onSend, onGift, menuItems, placeholder = 'Say Hi...', bottomInset = 0 }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <>
      <KeyboardAvoidingView behavior="padding" style={styles.wrap}>
        {emojiOpen && <EmojiPicker onPick={(e) => setDraft((d) => d + e)} />}
        <View style={[styles.row, { paddingBottom: (bottomInset || insets.bottom) + 8 }]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor="rgba(255,255,255,0.6)"
              maxLength={500}
              onSubmitEditing={send}
              onFocus={() => setEmojiOpen(false)}
              returnKeyType="send"
            />
            {draft.trim().length > 0 && (
              <Pressable onPress={send} hitSlop={8} accessibilityLabel="Send message">
                <Ionicons name="send" size={18} color="#FF4D8D" />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.iconBtn} onPress={() => setEmojiOpen((o) => !o)} accessibilityLabel="Emoji">
            <Ionicons name={emojiOpen ? 'keypad' : 'happy-outline'} size={26} color="#FFF" />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => setMenuOpen(true)} accessibilityLabel="Menu">
            <Ionicons name="menu" size={26} color="#FFF" />
          </Pressable>
          <Pressable onPress={onGift} accessibilityLabel="Send a gift">
            <LinearGradient colors={['#FF5FA2', '#FF2E7E']} style={styles.giftBtn}>
              <Ionicons name="gift" size={20} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {menuOpen && (
        // An in-screen layer (not a Modal, which can blank the camera on Android)
        // drawn above everything else, so the chat can never sit over it.
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
            <Pressable style={[styles.sheet, { paddingBottom: (bottomInset || insets.bottom) + 16 }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.grabber} />
              <View style={styles.grid}>
                {menuItems.map((item) => (
                  <Pressable
                    key={item.key}
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuOpen(false);
                      item.onPress();
                    }}
                  >
                    <View style={[styles.menuIcon, item.active && styles.menuIconActive, item.danger && styles.menuIconDanger]}>
                      <Ionicons name={item.icon} size={24} color="#FFF" />
                    </View>
                    <Text style={styles.menuLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 6 },
  inputWrap: { flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 21, paddingHorizontal: 14 },
  input: { flex: 1, color: '#FFF', fontSize: 14, paddingVertical: 0 },
  iconBtn: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
  giftBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: '#1B1430', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, maxHeight: '60%' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  menuItem: { width: '25%', alignItems: 'center', marginBottom: 18 },
  menuIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  menuIconActive: { backgroundColor: '#7B42F6' },
  menuIconDanger: { backgroundColor: '#E5384F' },
  menuLabel: { color: '#FFF', fontSize: 11, fontWeight: '700', maxWidth: '100%' },
});
