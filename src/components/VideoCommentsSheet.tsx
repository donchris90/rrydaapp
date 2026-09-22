import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideoComment, fetchVideoComments, postVideoComment, type VideoComment } from '../api/videos';
import { describeApiError } from '../api/errors';
import { Avatar } from './Avatar';

const PAGE = 30;

const ago = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

// The comments on a video, newest first, with a box to add one. You can delete your
// own comments; the video's creator can delete any comment on their video.
export function VideoCommentsSheet({ videoId, visible, onClose, isOwner, onCountChange }: { videoId: string; visible: boolean; onClose: () => void; isOwner: boolean; onCountChange?: (delta: number) => void }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const key = ['videos', 'comments', videoId];

  const query = useInfiniteQuery({
    queryKey: key,
    enabled: visible,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchVideoComments(videoId, pageParam),
    getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1].createdAt : undefined),
  });
  const comments = query.data?.pages.flat() ?? [];

  const post = useMutation({
    mutationFn: (t: string) => postVideoComment(videoId, t),
    onSuccess: () => {
      setText('');
      onCountChange?.(1);
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (e: any) => Alert.alert("Couldn't post", describeApiError(e, 'Please try again.')),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteVideoComment(videoId, id),
    onSuccess: () => {
      onCountChange?.(-1);
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (e: any) => Alert.alert("Couldn't delete", describeApiError(e, 'Please try again.')),
  });

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior="padding" style={{ width: '100%' }}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Comments</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color="#FFF" />
              </Pressable>
            </View>

            {query.isLoading ? (
              <ActivityIndicator color="#FF4D8D" style={{ marginVertical: 40 }} />
            ) : (
              <FlatList
                style={styles.list}
                data={comments}
                keyExtractor={(c) => c.id}
                onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
                ListEmptyComponent={<Text style={styles.empty}>{query.isError ? 'Could not load comments.' : 'No comments yet. Be the first.'}</Text>}
                renderItem={({ item }: { item: VideoComment }) => (
                  <View style={styles.row}>
                    <Avatar name={item.user.displayName} size={34} imageUrl={item.user.avatarUrl} ring={false} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>
                        {item.user.displayName ?? 'Someone'} <Text style={styles.time}>{ago(item.createdAt)}</Text>
                      </Text>
                      <Text style={styles.body}>{item.text}</Text>
                    </View>
                    {(item.mine || isOwner) && (
                      <Pressable hitSlop={10} onPress={() => remove.mutate(item.id)} accessibilityLabel="Delete comment">
                        <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.55)" />
                      </Pressable>
                    )}
                  </View>
                )}
              />
            )}

            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Add a comment…" placeholderTextColor="rgba(255,255,255,0.5)" maxLength={300} onSubmitEditing={() => text.trim() && post.mutate(text)} returnKeyType="send" />
              <Pressable style={[styles.send, !text.trim() && { opacity: 0.4 }]} disabled={!text.trim() || post.isPending} onPress={() => post.mutate(text)}>
                <Ionicons name="send" size={18} color="#FFF" />
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#1B1430', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 14, paddingTop: 12, maxHeight: '75%', minHeight: 320 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  list: { flexGrow: 0, maxHeight: 360 },
  empty: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', paddingVertical: 40 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 8, alignItems: 'flex-start' },
  name: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  time: { color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: 11 },
  body: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 2, lineHeight: 19 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  input: { flex: 1, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFF', paddingHorizontal: 16, fontSize: 14 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FF2E7E', alignItems: 'center', justifyContent: 'center' },
});
