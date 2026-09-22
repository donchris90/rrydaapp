import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../../api/search';
import { GradientBackground } from '../../components/GradientBackground';
import { UserListRow } from '../../components/UserListRow';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

// search.service.ts requires 2+ characters before it queries the DB at
// all, so there's no point firing a request per keystroke below that —
// this debounce just avoids hammering the endpoint while someone's still
// typing a name out.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const MAX_RECENT = 8;

export function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(true);
  // Real, but session-only — no persistent-storage library is installed
  // in this project, and adding one would mean another native dependency
  // and rebuild. This resets when the app restarts; said plainly rather
  // than implied to be more than it is.
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const searchQuery = useQuery({
    queryKey: ['search', 'users', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const commitSearch = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    setRecentSearches((current) => [trimmed, ...current.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT));
  };

  useEffect(() => {
    if (debouncedQuery.length >= 2 && searchQuery.data && searchQuery.data.length > 0) {
      commitSearch(debouncedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery.data]);

  const showRecents = query.length === 0 && recentSearches.length > 0;
  const showEmpty = debouncedQuery.length >= 2 && !searchQuery.isLoading && (searchQuery.data?.length ?? 0) === 0;
  const showHint = query.length === 0 && recentSearches.length === 0;

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => commitSearch(query)}
            placeholder="Search creators"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={12}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {showHint ? (
        <FadeInUp index={0} style={styles.hintWrap}>
          <Text style={styles.hint}>Type at least 2 characters to search by name.</Text>
        </FadeInUp>
      ) : showRecents ? (
        <FadeInUp index={0} style={styles.recentsWrap}>
          <View style={styles.recentsHeader}>
            <Text style={styles.recentsTitle}>Recent searches</Text>
            <Pressable onPress={() => setRecentSearches([])}>
              <Text style={styles.recentsClear}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.recentsChips}>
            {recentSearches.map((s) => (
              <Pressable key={s} style={styles.recentChip} onPress={() => setQuery(s)}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.recentChipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </FadeInUp>
      ) : showEmpty ? (
        <FadeInUp index={0} style={styles.hintWrap}>
          <Text style={styles.hint}>No one found for "{debouncedQuery}".</Text>
        </FadeInUp>
      ) : (
        <FlatList
          data={searchQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <FadeInUp index={index}>
              <UserListRow user={item} />
            </FadeInUp>
          )}
        />
      )}
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
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  inputWrapFocused: { borderColor: colors.primary },
  input: { flex: 1, ...type.body, color: colors.textPrimary, padding: 0 },
  hintWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' },
  hint: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  recentsWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  recentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  recentsTitle: { ...type.caption, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  recentsClear: { ...type.caption, color: colors.primary, fontWeight: '700' },
  recentsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  recentChipText: { ...type.caption, color: colors.textPrimary, fontWeight: '600' },
});
