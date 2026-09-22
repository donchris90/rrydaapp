import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type } from '../theme';

// Curated presets — the backend accepts any #RRGGBB, but a fixed palette
// keeps every option legible against the room's dark background.
export const ROOM_THEME_PRESETS: { name: string; hex: string }[] = [
  { name: 'Rose', hex: '#FF2E7E' },
  { name: 'Violet', hex: '#7B42F6' },
  { name: 'Azure', hex: '#4D8DFF' },
  { name: 'Mint', hex: '#3DF5A0' },
  { name: 'Gold', hex: '#FFC24B' },
  { name: 'Ember', hex: '#FF6B35' },
  { name: 'Cyan', hex: '#00E5FF' },
  { name: 'Orchid', hex: '#E040FB' },
];

interface Props {
  selected: string;
  pending?: boolean;
  onSelect: (hex: string) => void;
}

export function RoomThemeSwatches({ selected, pending, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>Everyone in the room sees the new theme right away.</Text>
      <View style={styles.grid}>
        {ROOM_THEME_PRESETS.map((preset) => {
          const isSelected = preset.hex.toLowerCase() === selected.toLowerCase();
          return (
            <Pressable
              key={preset.hex}
              style={styles.item}
              onPress={() => !isSelected && onSelect(preset.hex)}
              disabled={pending}
              accessibilityLabel={`${preset.name} theme`}
            >
              <View style={[styles.swatch, { backgroundColor: preset.hex }, isSelected && styles.swatchSelected]}>
                {isSelected && <Ionicons name="checkmark" size={20} color="#FFF" />}
              </View>
              <Text style={styles.name}>{preset.name}</Text>
            </Pressable>
          );
        })}
      </View>
      {pending && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm },
  hint: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: { width: 64, alignItems: 'center', gap: 4 },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: '#FFF' },
  name: { ...type.caption, color: colors.textSecondary },
});
