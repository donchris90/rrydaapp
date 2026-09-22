import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import type { AppStackParamList } from '../../navigation/types';
import { audioContentType, createEdit, fetchEdit, fileSize, publishUploaded, putFile, requestEditUpload, requestVideoUpload, videoContentType, type EditSpecInput } from '../../api/videoEdits';
import { describeApiError } from '../../api/errors';
import type { EffectName, FilterName } from '../../video/editorConfig';
import { isPlainPost } from '../../video/editorConfig';

type Step = 'form' | 'uploading' | 'processing' | 'failed';

// The last step: name it, then post. A video with no edits is uploaded and published
// straight away. An edited one is uploaded and then made on the server (this can take
// a minute or two), and opens in the feed when it is ready — or, if you leave, you get
// a notification when it is.
export function VideoPublishScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppStackParamList, 'VideoPublish'>>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const p = route.params;

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tag, setTag] = useState('');
  const [allowGifts, setAllowGifts] = useState(true);
  const [musicTitle, setMusicTitle] = useState(p.music?.name ?? '');
  const [step, setStep] = useState<Step>('form');
  const [label, setLabel] = useState('');
  const [fraction, setFraction] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => () => void (alive.current = false), []);

  const openVideo = (videoId: string) => {
    queryClient.invalidateQueries({ queryKey: ['videos'] });
    navigation.dispatch(StackActions.popToTop());
    setTimeout(() => navigation.navigate('VideoFeed', { videoId }), 50);
  };

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const post = async () => {
    const name = title.trim();
    if (!name) return Alert.alert('Add a title', 'Give your video a title first.');
    setError(null);
    setStep('uploading');
    try {
      const trimmed = p.trimStartMs > 0 || p.trimEndMs < p.durationMs - 50;
      const plain = isPlainPost({ trimStartMs: p.trimStartMs, trimEndMs: p.trimEndMs, speed: p.speed, filter: p.filter as FilterName, effect: p.effect as EffectName }, p.durationMs, !!p.overlayUri, !!p.music);

      setLabel('Uploading your video…');
      const vType = videoContentType(p.uri);
      const vGrant = await requestVideoUpload(vType, await fileSize(p.uri));
      // A stand-in storage (development only) hands out an address nothing listens on: skip the transfer.
      if (!vGrant.uploadUrl.startsWith('mock://')) await putFile(p.uri, vGrant, vType, setFraction);

      if (plain) {
        setLabel('Publishing…');
        const video = await publishUploaded({ storageKey: vGrant.storageKey, title: name, caption: caption.trim() || undefined, tag: tag.trim() || undefined, allowGifts, durationSeconds: Math.round(p.durationMs / 1000) });
        if (alive.current) openVideo(video.id);
        return;
      }

      let overlayKey: string | null = null;
      if (p.overlayUri) {
        setLabel('Uploading your text and stickers…');
        setFraction(0);
        const grant = await requestEditUpload('overlay', 'image/png', await fileSize(p.overlayUri));
        await putFile(p.overlayUri, grant, 'image/png', setFraction);
        overlayKey = grant.storageKey;
      }
      let musicKey: string | null = null;
      if (p.music) {
        const type = audioContentType(p.music.mimeType, p.music.uri);
        if (!type) throw new Error('That music file type is not supported. Use MP3, M4A, AAC, WAV or OGG.');
        setLabel('Uploading your music…');
        setFraction(0);
        const grant = await requestEditUpload('music', type, await fileSize(p.music.uri));
        await putFile(p.music.uri, grant, type, setFraction);
        musicKey = grant.storageKey;
      }

      const spec: EditSpecInput = {
        trim: trimmed ? { startMs: Math.round(p.trimStartMs), endMs: Math.round(p.trimEndMs) } : undefined,
        speed: p.speed,
        filter: p.filter as FilterName,
        effect: p.effect as EffectName,
        music: p.music ? { volumeOriginal: p.music.volumeOriginal, volumeMusic: p.music.volumeMusic } : undefined,
      };
      const job = await createEdit({ sourceKey: vGrant.storageKey, overlayKey, musicKey, musicTitle: p.music ? musicTitle.trim() || p.music.name : null, spec, title: name, caption: caption.trim() || undefined, tag: tag.trim() || undefined, allowGifts });

      setStep('processing');
      setLabel('Making your video…');
      // Check every few seconds until it is done.
      for (let i = 0; i < 300 && alive.current; i++) {
        await wait(3000);
        const status = await fetchEdit(job.id).catch(() => null);
        if (!status) continue;
        if (status.status === 'DONE' && status.videoId) {
          if (alive.current) openVideo(status.videoId);
          return;
        }
        if (status.status === 'FAILED') throw new Error(status.error ?? 'We could not process this video.');
      }
    } catch (e: any) {
      if (!alive.current) return;
      setError(e?.response?.data?.message ? describeApiError(e, '') : (e?.message ?? 'Something went wrong.'));
      setStep('failed');
    }
  };

  const busy = step === 'uploading' || step === 'processing';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} disabled={busy}>
          <Ionicons name="chevron-back" size={26} color={busy ? 'rgba(255,255,255,0.3)' : '#FFF'} />
        </Pressable>
        <Text style={styles.title}>Post</Text>
        <View style={{ width: 26 }} />
      </View>

      {busy ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF4D8D" />
          <Text style={styles.big}>{label}</Text>
          {step === 'uploading' && fraction > 0 && (
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round(fraction * 100)}%` }]} />
            </View>
          )}
          {step === 'processing' ? (
            <>
              <Text style={styles.sub}>This can take a minute or two. You can leave — we'll notify you when it's ready.</Text>
              <Pressable style={styles.ghost} onPress={() => navigation.dispatch(StackActions.popToTop())}>
                <Text style={styles.ghostText}>Continue in the background</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.sub}>Keep the app open while it uploads.</Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
          {step === 'failed' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>It didn't work</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="rgba(255,255,255,0.5)" maxLength={100} />
          <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]} value={caption} onChangeText={setCaption} placeholder="Say something about it…" placeholderTextColor="rgba(255,255,255,0.5)" multiline maxLength={500} />
          <TextInput style={styles.input} value={tag} onChangeText={setTag} placeholder="#hashtag (optional)" placeholderTextColor="rgba(255,255,255,0.5)" autoCapitalize="none" maxLength={40} />
          {p.music && <TextInput style={styles.input} value={musicTitle} onChangeText={setMusicTitle} placeholder="Music title shown under the video" placeholderTextColor="rgba(255,255,255,0.5)" maxLength={60} />}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Allow gifts</Text>
              <Text style={styles.rowSub}>Viewers can send you tips on this video.</Text>
            </View>
            <Switch value={allowGifts} onValueChange={setAllowGifts} trackColor={{ true: '#FF2E7E' }} />
          </View>
          <Pressable style={styles.postBtn} onPress={post}>
            <Text style={styles.postText}>{step === 'failed' ? 'Try again' : 'Post'}</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12141C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 },
  big: { color: '#FFF', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.65)', textAlign: 'center', fontSize: 13, lineHeight: 19 },
  bar: { width: '80%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: '#FF2E7E' },
  ghost: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  ghostText: { color: '#FFF', fontWeight: '800' },
  input: { height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', paddingHorizontal: 14, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rowTitle: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  rowSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  postBtn: { height: 52, borderRadius: 26, backgroundColor: '#FF2E7E', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  postText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  errorBox: { backgroundColor: 'rgba(255,59,78,0.14)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,59,78,0.5)' },
  errorTitle: { color: '#FF7A8A', fontWeight: '900', marginBottom: 4 },
  errorText: { color: '#FFF', fontSize: 13, lineHeight: 18 },
});
