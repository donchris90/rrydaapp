import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Emojis are listed as space-separated strings and split on the spaces, not
// broken up by character: many emojis are several code points joined together
// (❤️, ✌️, 👍🏽) and splitting them by character would show broken symbols.
const SETS: { key: string; icon: string; emojis: string }[] = [
  {
    key: 'faces',
    icon: '😀',
    emojis:
      '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🫣 🤗 🤔 🫡 🤭 🫢 🤫 🤥 😶 🫥 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾',
  },
  {
    key: 'hands',
    icon: '👍',
    emojis:
      '👍 👎 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 🫵 👋 🤚 🖐️ ✋ 🖖 🫱 🫲 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦵 🦶 👂 👃 🧠 🫀 🫁 🦷 👀 👁️ 👅 👄 🙋 🙆 🙅 🙇 🤦 🤷 💁 🙎 🙍 💃 🕺 🚶 🏃 🧍 🧎 👯 🧘 🤸 🏋️ 🚴 🏊',
  },
  {
    key: 'hearts',
    icon: '❤️',
    emojis:
      '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 ❤️‍🔥 ❤️‍🩹 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ♥️ 😻 💋 💌 💯 💢 💥 💫 💦 💨 🕊️ 🌹 🥀 🌸 🌺 🌻 🌷 🌼 💐 🍀 🌈 ✨ 🔥 ⭐ 🌟 💎 👑',
  },
  {
    key: 'party',
    icon: '🎉',
    emojis:
      '🎉 🎊 🎈 🎁 🎂 🍾 🥂 🍻 🍸 🍹 🥳 🎶 🎵 🎤 🎧 🎸 🥁 🎹 🎺 🎷 🪘 🔥 ✨ 🌟 ⭐ 💥 🎆 🎇 🧨 💎 👑 🏆 🥇 🥈 🥉 🏅 🎖️ 🎯 🎮 🕹️ 🎰 🎲 ♟️ 🪩 🚀 🛸 🌈 ☀️ 🌙 ⚡ 💰 💸 🪙 💵 💳 🛍️ 🎬 📸 🎥 📺',
  },
  {
    key: 'animals',
    icon: '🐶',
    emojis:
      '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🦅 🦆 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🕷️ 🐢 🐍 🦎 🐙 🦑 🦐 🦀 🐡 🐠 🐟 🐬 🐳 🦈 🐊 🐘 🦏 🦛 🐪 🦒 🦓 🦍 🐕 🐩 🐈 🐓 🦚 🦜 🌵 🌴 🌳 🍁 🌍',
  },
  {
    key: 'food',
    icon: '🍔',
    emojis:
      '🍎 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🍆 🥕 🌽 🌶️ 🥔 🍠 🥖 🍞 🥐 🧀 🥚 🍳 🥞 🥓 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥙 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍚 🍘 🍥 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍦 🍿 ☕ 🍵 🧃 🥤 🍺 🍷 🥃',
  },
  {
    key: 'travel',
    icon: '🚗',
    emojis:
      '🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚚 🚜 🏍️ 🛵 🚲 🛴 ✈️ 🛫 🛬 🚁 🚀 🛸 ⛵ 🚤 🛥️ 🚢 🚂 🚆 🚇 🏠 🏡 🏢 🏫 🏥 🏦 🏨 🏰 🗼 🗽 ⛪ 🕌 🛕 ⛺ 🏖️ 🏝️ 🏔️ 🌋 🗺️ 🧭 ⏰ 🌅 🌃 🌉',
  },
  {
    key: 'objects',
    icon: '💡',
    emojis:
      '⌚ 📱 💻 🖥️ 🎮 📷 📹 🎞️ 📞 ☎️ 📺 📻 🔋 🔌 💡 🔦 🕯️ 💰 💸 💳 🧾 ✉️ 📦 📈 📉 📌 📎 ✂️ 🔒 🔑 🗝️ 🔨 🛠️ ⚙️ 🧲 💊 🩺 🧴 🧼 🪥 🛒 🎓 📚 📖 ✏️ 🖊️ 🎒 👓 🕶️ 👔 👗 👠 👑 💍 👜 🎩 🧢',
  },
  {
    key: 'symbols',
    icon: '💯',
    emojis:
      '💯 ✅ ❌ ❎ ⭕ ❗ ❓ ‼️ ⁉️ ⚠️ 🚫 ♻️ 🔔 🔕 📣 📢 💬 💭 🗯️ ➕ ➖ ➗ ✖️ ♾️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ ▶️ ⏸️ ⏹️ ⏩ ⏪ 🔀 🔁 🆒 🆕 🆓 🔝 🔛 🆗 🆘 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ 🔄',
  },
  {
    key: 'flags',
    icon: '🏁',
    emojis:
      '🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🇳🇬 🇬🇭 🇰🇪 🇿🇦 🇪🇬 🇲🇦 🇪🇹 🇹🇿 🇺🇬 🇸🇳 🇨🇮 🇨🇲 🇷🇼 🇿🇼 🇦🇴 🇩🇿 🇹🇳 🇱🇾 🇸🇩 🇺🇸 🇬🇧 🇨🇦 🇫🇷 🇩🇪 🇮🇹 🇪🇸 🇵🇹 🇳🇱 🇧🇷 🇦🇷 🇲🇽 🇨🇴 🇯🇲 🇹🇹 🇮🇳 🇵🇰 🇧🇩 🇨🇳 🇯🇵 🇰🇷 🇵🇭 🇮🇩 🇹🇷 🇸🇦 🇦🇪 🇯🇴 🇷🇺 🇺🇦 🇦🇺',
  },
];

// The last emojis you used, kept while the app is open (most recent first).
const recent: string[] = [];
const MAX_RECENT = 24;
function remember(emoji: string) {
  const i = recent.indexOf(emoji);
  if (i >= 0) recent.splice(i, 1);
  recent.unshift(emoji);
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
}

const COLUMNS = 8;

// A compact emoji panel for chat. `height` is fixed so it never grows over the
// video; it scrolls inside itself.
export function EmojiPicker({ onPick, height = 190 }: { onPick: (emoji: string) => void; height?: number }) {
  const [active, setActive] = useState(recent.length > 0 ? 'recent' : SETS[0].key);
  const [, force] = useState(0);
  const list = active === 'recent' ? [...recent] : (SETS.find((s) => s.key === active) ?? SETS[0]).emojis.split(' ');
  const tabs = recent.length > 0 ? [{ key: 'recent', icon: '🕘', emojis: '' }, ...SETS] : SETS;

  return (
    <View style={[styles.panel, { height }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {tabs.map((s) => (
          <Pressable key={s.key} onPress={() => setActive(s.key)} style={[styles.tab, active === s.key && styles.tabActive]} accessibilityLabel={`${s.key} emojis`}>
            <Text style={styles.tabIcon}>{s.icon}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList
        data={list}
        keyExtractor={(e, i) => `${active}-${i}`}
        numColumns={COLUMNS}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable onPress={() => { remember(item); force((n) => n + 1); onPick(item); }} style={styles.cell} hitSlop={2}>
            <Text style={styles.emoji}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

export const EMOJI_COUNT = SETS.reduce((n, s) => n + s.emojis.split(' ').length, 0);

const styles = StyleSheet.create({
  panel: { backgroundColor: 'rgba(16,12,32,0.96)', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 6 },
  tabsScroll: { flexGrow: 0 },
  tabs: { flexDirection: 'row', gap: 2, paddingHorizontal: 6, paddingBottom: 4 },
  tab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.14)' },
  tabIcon: { fontSize: 20 },
  cell: { width: `${100 / COLUMNS}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  emoji: { fontSize: 24 },
});
