import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { searchVideos } from '../../api/videos';
import { Avatar } from '../../components/Avatar';

// Search videos by title, caption, #hashtag or creator name. Tapping a result plays
// it in the feed.
export function VideoSearchScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTerm(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const query = useQuery({ queryKey: ['videos', 'search', term], queryFn: () => searchVideos(term), enabled: term.length >= 2, retry: false });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Search videos, #tags, creators" placeholderTextColor="rgba(255,255,255,0.5)" autoFocus autoCapitalize="none" returnKeyType="search" />
        </View>
      </View>

      {term.length < 2 ? (
        <Text style={styles.hint}>Type at least 2 characters.</Text>
      ) : query.isLoading ? (
        <ActivityIndicator color="#FF4D8D" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={<Text style={styles.hint}>{query.isError ? 'Could not search right now.' : `Nothing found for "${term}".`}</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => navigation.navigate('VideoFeed', { videoId: item.id })}>
              <Avatar name={item.creator.displayName} size={44} imageUrl={item.creator.avatarUrl} ring={false} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.creator.displayName ?? 'Creator'}
                  {item.tag ? `  ·  #${item.tag.replace(/^#/, '')}` : ''}
                </Text>
              </View>
              <View style={styles.likes}>
                <Ionicons name="heart" size={14} color="#FF2E7E" />
                <Text style={styles.likeText}>{item.likeCount.toLocaleString('en-US')}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0A1A' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 10 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14 },
  input: { flex: 1, color: '#FFF', fontSize: 14, paddingVertical: 0 },
  hint: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 40, paddingHorizontal: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  title: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  sub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
