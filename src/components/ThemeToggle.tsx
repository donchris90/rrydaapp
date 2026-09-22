import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../theme';

export function ThemeToggle({ compact = true, variant = 'compact' }: { compact?: boolean; variant?: 'compact' | 'icon' | 'card' }) {
  const { isMidnight, toggleTheme, setTheme } = useTheme();

  if (variant === 'card') {
    return (
      <View style={[styles.card, isMidnight ? styles.cardDark : styles.cardLight]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.themeIcon, isMidnight ? styles.themeIconDark : styles.themeIconLight]}>
              <Ionicons name={isMidnight ? 'moon' : 'sunny'} size={15} color={isMidnight ? '#FFD200' : '#FF9500'} />
            </View>
            <View style={styles.cardTitleText}>
              <Text style={[styles.cardTitle, isMidnight ? styles.textLight : styles.textDark]}>Interface Theme</Text>
              <Text style={[styles.cardSubtitle, isMidnight ? styles.textMutedDark : styles.textMutedLight]}>
                {isMidnight ? 'Midnight Dark mode active for night viewing' : 'Bright Porcelain mode active for high vibrancy'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.switcher, isMidnight ? styles.switcherDark : styles.switcherLight]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use Bright Porcelain theme"
            onPress={() => setTheme('porcelain')}
            style={[styles.option, !isMidnight && styles.optionActiveLight]}
          >
            <Ionicons name="sunny" size={13} color="#FF9500" />
            <Text style={[styles.optionText, !isMidnight ? styles.optionTextActive : styles.textMutedDark]}>Porcelain</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use Midnight Dark theme"
            onPress={() => setTheme('midnight')}
            style={[styles.option, isMidnight && styles.optionActiveDark]}
          >
            <Ionicons name="moon" size={13} color="#A27BFF" />
            <Text style={[styles.optionText, isMidnight ? styles.optionTextActiveLight : styles.textMutedLight]}>Midnight</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={toggleTheme} hitSlop={8} style={[styles.wrap, compact && styles.compact]} accessibilityRole="button" accessibilityLabel="Toggle app theme">
      <View style={[styles.track, isMidnight && styles.trackDark]}>
        <View style={[styles.thumb, isMidnight && styles.thumbDark]}>
          <Ionicons name={isMidnight ? 'moon' : 'sunny'} size={compact ? 14 : 16} color={isMidnight ? '#FFFFFF' : '#FF9500'} />
        </View>
        {!compact && <Text style={[styles.label, isMidnight && styles.labelDark]}>{isMidnight ? 'Midnight' : 'Porcelain'}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  compact: {},
  track: { width: 42, height: 26, borderRadius: radii.pill, backgroundColor: '#FFE8F1', padding: 3, justifyContent: 'center' },
  trackDark: { backgroundColor: '#2A2340' },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', transform: [{ translateX: 0 }] },
  thumbDark: { backgroundColor: '#7B42F6', transform: [{ translateX: 16 }] },
  label: { color: '#14121E', fontSize: 11, fontWeight: '800', marginLeft: 8 },
  labelDark: { color: '#F7F4FF' },
  card: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#EFF1F6' },
  cardDark: { backgroundColor: '#181329', borderColor: '#2E264E' },
  cardHeader: { marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  themeIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  themeIconLight: { backgroundColor: '#FFF9E6' },
  themeIconDark: { backgroundColor: '#261E42' },
  cardTitleText: { flex: 1 },
  cardTitle: { fontSize: 12, fontWeight: '900' },
  cardSubtitle: { fontSize: 10, marginTop: 2 },
  textDark: { color: '#14121E' },
  textLight: { color: '#F5F3FF' },
  textMutedLight: { color: '#9692A8' },
  textMutedDark: { color: '#8D84AE' },
  switcher: { flexDirection: 'row', padding: 4, borderRadius: 12, gap: 4 },
  switcherLight: { backgroundColor: '#F4F6FC' },
  switcherDark: { backgroundColor: '#100C1F' },
  option: { flex: 1, minHeight: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  optionActiveLight: { backgroundColor: '#FFFFFF' },
  optionActiveDark: { backgroundColor: '#292244' },
  optionText: { fontSize: 11, fontWeight: '800' },
  optionTextActive: { color: '#14121E' },
  optionTextActiveLight: { color: '#F5F3FF' },
});
