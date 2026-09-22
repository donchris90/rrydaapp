import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchMyVideos } from '../../api/videos';
import type { LiveMediaState } from '../../api/liveMedia';

interface Props {
  visible: boolean;
  onClose: () => void;
  pkActive: boolean;
  activeVideo: LiveMediaState | null;
  onLoadVideo: (videoId: string) => Promise<void> | void;
  onStopVideo: () => void;
  music: { name: string; status: 'playing' | 'paused'; volume: number } | null;
  musicError: string | null;
  onStartMusic: (uri: string, name: string, loop: boolean) => void;
  onPauseMusic: () => void;
  onResumeMusic: () => void;
  onStopMusic: () => void;
  onMusicVolume: (v: number) => void;
}

const fmt = (s: number | null) => (s == null ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

// The host's "Video & music" panel. VIDEO: pick one of your published videos and it
// plays in the live for everyone. MUSIC: pick a song from your phone and it plays
// into the live with your voice. (Use headphones so the mic doesn't pick it up twice.)
export function LiveMediaSheet(props: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'video' | 'music'>('video');
  const [loop, setLoop] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const videosQuery = useQuery({ queryKey: ['videos', 'mine'], queryFn: fetchMyVideos, enabled: props.visible && tab === 'video' });

  if (!props.visible) return null;

  const loadVideo = async (id: string) => {
    if (props.pkActive) return Alert.alert('PK is on', 'Finish the PK battle before sharing a video.');
    setLoading(id);
    try {
      await props.onLoadVideo(id);
      props.onClose();
    } catch (e: any) {
      Alert.alert("Couldn't share the video", e?.response?.data?.message ?? 'Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const pickSong = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    props.onStartMusic(a.uri, a.name ?? 'Song', loop);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
      <Pressable style={styles.backdrop} onPress={props.onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          <View style={styles.tabs}>
            {(['video', 'music'] as const).map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
                <Ionicons name={t === 'video' ? 'film' : 'musical-notes'} size={15} color="#FFF" />
                <Text style={styles.tabText}>{t === 'video' ? 'Video' : 'Music'}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'video' ? (
            <>
              {props.activeVideo && (
                <View style={styles.now}>
                  <Ionicons name="film" size={18} color="#FF2E7E" />
                  <Text style={styles.nowText} numberOfLines={1}>
                    Sharing: {props.activeVideo.title}
                  </Text>
                  <Pressable style={styles.stopBtn} onPress={() => { props.onStopVideo(); props.onClose(); }}>
                    <Text style={styles.stopText}>Stop</Text>
                  </Pressable>
                </View>
              )}
              <Text style={styles.hint}>Pick one of your published videos. Everyone in your live watches it with you.</Text>
              {videosQuery.isLoading ? (
                <ActivityIndicator color="#FF4D8D" style={{ marginVertical: 24 }} />
              ) : (
                <FlatList
                  style={{ maxHeight: 280 }}
                  data={videosQuery.data?.videos ?? []}
                  keyExtractor={(v) => v.id}
                  ListEmptyComponent={<Text style={styles.empty}>You have no published videos yet. Upload one under Creator Center → Videos, then come back.</Text>}
                  renderItem={({ item }) => (
                    <Pressable style={styles.row} onPress={() => loadVideo(item.id)} disabled={!!loading}>
                      <View style={styles.thumb}>
                        <Ionicons name="play" size={16} color="#FFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.rowSub}>{fmt(item.durationSeconds)}</Text>
                      </View>
                      {loading === item.id ? <ActivityIndicator color="#FF4D8D" /> : <Text style={styles.play}>Play</Text>}
                    </Pressable>
                  )}
                />
              )}
            </>
          ) : (
            <>
              {props.music ? (
                <View style={styles.musicBox}>
                  <View style={styles.now}>
                    <Ionicons name="musical-notes" size={18} color="#FF2E7E" />
                    <Text style={styles.nowText} numberOfLines={1}>
                      {props.music.name}
                    </Text>
                  </View>
                  <View style={styles.musicControls}>
                    <Pressable style={styles.ctrl} onPress={props.music.status === 'playing' ? props.onPauseMusic : props.onResumeMusic}>
                      <Ionicons name={props.music.status === 'playing' ? 'pause' : 'play'} size={22} color="#FFF" />
                    </Pressable>
                    <Pressable style={[styles.ctrl, { backgroundColor: 'rgba(229,56,79,0.85)' }]} onPress={props.onStopMusic}>
                      <Ionicons name="stop" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                  <View style={styles.volumeRow}>
                    <Ionicons name="volume-low" size={16} color="#FFF" />
                    <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={100} value={props.music.volume} onSlidingComplete={props.onMusicVolume} minimumTrackTintColor="#FF2E7E" maximumTrackTintColor="rgba(255,255,255,0.3)" thumbTintColor="#FF2E7E" />
                    <Ionicons name="volume-high" size={16} color="#FFF" />
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.hint}>Pick a song from your phone. It plays into your live so everyone hears it with your voice. Use headphones to avoid an echo.</Text>
                  <Pressable style={styles.pickBtn} onPress={pickSong}>
                    <Ionicons name="folder-open" size={18} color="#FFF" />
                    <Text style={styles.pickText}>Choose a song</Text>
                  </Pressable>
                  <Pressable style={styles.loopRow} onPress={() => setLoop((l) => !l)}>
                    <Ionicons name={loop ? 'checkbox' : 'square-outline'} size={20} color="#FFF" />
                    <Text style={styles.loopText}>Repeat the song</Text>
                  </Pressable>
                </>
              )}
              {props.musicError && <Text style={styles.error}>{props.musicError}</Text>}
            </>
          )}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: '#1B1430', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, maxHeight: '75%' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: '#FF2E7E' },
  tabText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  hint: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 17, marginBottom: 10 },
  empty: { color: 'rgba(255,255,255,0.65)', textAlign: 'center', paddingVertical: 24, lineHeight: 19 },
  now: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,46,126,0.14)', borderRadius: 12, padding: 10, marginBottom: 10 },
  nowText: { color: '#FFF', fontWeight: '800', flex: 1, fontSize: 13 },
  stopBtn: { backgroundColor: 'rgba(229,56,79,0.9)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  stopText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  rowSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 1 },
  play: { color: '#FF2E7E', fontWeight: '900' },
  musicBox: { gap: 12 },
  musicControls: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  ctrl: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FF2E7E', alignItems: 'center', justifyContent: 'center' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 23, backgroundColor: '#7B42F6' },
  pickText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  loopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  loopText: { color: '#FFF', fontSize: 13 },
  error: { color: '#FF7A8A', marginTop: 10, fontSize: 12 },
});
