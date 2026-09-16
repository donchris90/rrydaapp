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

export function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const searchQuery = useQuery({
    queryKey: ['search', 'users', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const showEmpty = debouncedQuery.length >= 2 && !searchQuery.isLoading && (searchQuery.data?.length ?? 0) === 0;
  const showHint = debouncedQuery.length < 2;

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
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
  input: { flex: 1, ...type.body, color: colors.textPrimary, padding: 0 },
  hintWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' },
  hint: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
});
