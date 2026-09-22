import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { captureRef } from 'react-native-view-shot';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../../navigation/types';
import { OverlayItemView } from '../../components/editor/OverlayItemView';
import {
  EFFECTS,
  FILTERS,
  SPEEDS,
  STICKERS,
  TEXT_COLORS,
  canvasFit,
  isPlainPost,
  type EffectName,
  type FilterName,
  type MusicChoice,
  type OverlayItem,
  type Speed,
} from '../../video/editorConfig';

type Panel = 'edit' | 'text' | 'sticker' | 'effects' | 'filters' | 'music' | null;
const TOOLS: { key: Exclude<Panel, 'music' | null>; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'edit', label: 'Edit', icon: 'cut' },
  { key: 'text', label: 'Text', icon: 'text' },
  { key: 'sticker', label: 'Sticker', icon: 'happy-outline' },
  { key: 'effects', label: 'Effects', icon: 'star-outline' },
  { key: 'filters', label: 'Filters', icon: 'color-filter-outline' },
];

const fmt = (ms: number) => {
  const s = Math.max(0, ms) / 1000;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};
const uid = () => `i${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

// The editor, laid out like your picture: the video full-screen, tools down the right
// (Edit, Text, Sticker, Effects, Filters), "Add music" on top, a progress bar and the
// arrow to continue. The preview is a 9:16 canvas — the same shape the finished video
// has — so text and stickers land exactly where you put them. Filters and effects are
// previewed roughly; the finished video (made on the server) has the exact look.
export function VideoEditorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppStackParamList, 'VideoEditor'>>();
  const insets = useSafeAreaInsets();
  const { width: sw } = useWindowDimensions();
  const { uri, durationMs: pickedDuration, width: vw, height: vh } = route.params;
  const cw = sw;
  const ch = Math.round((sw * 16) / 9);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false; // the loop is done by hand, inside the trimmed part
    p.play();
  });
  const [duration, setDuration] = useState(pickedDuration || 0);
  const [aspect, setAspect] = useState(vw && vh ? vw / vh : 9 / 16);
  const [trim, setTrim] = useState<[number, number]>([0, pickedDuration || 0]);
  const [speed, setSpeed] = useState<Speed>(1);
  const [filter, setFilter] = useState<FilterName>('none');
  const [effect, setEffect] = useState<EffectName>('none');
  const [items, setItems] = useState<OverlayItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [music, setMusic] = useState<MusicChoice | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const overlayRef = useRef<View>(null);

  // The real length and shape of the video, once it has loaded.
  useEffect(() => {
    const sub = player.addListener('sourceLoad', (p) => {
      const d = Math.round((p.duration || 0) * 1000);
      if (d > 0) {
        setDuration(d);
        setTrim((t) => (t[1] === 0 || t[1] > d || !pickedDuration ? [t[0], d] : t));
      }
      const size = p.availableVideoTracks?.[0]?.size;
      if (size?.width && size?.height) setAspect(size.width / size.height);
    });
    return () => sub.remove();
  }, [player, pickedDuration]);

  // Loop inside the trimmed part and keep the progress bar moving.
  useEffect(() => {
    const t = setInterval(() => {
      const nowMs = player.currentTime * 1000;
      if (trim[1] > 0 && (nowMs >= trim[1] || nowMs < trim[0] - 300)) player.currentTime = trim[0] / 1000;
      const span = Math.max(1, trim[1] - trim[0]);
      setProgress(Math.min(1, Math.max(0, (player.currentTime * 1000 - trim[0]) / span)));
    }, 150);
    return () => clearInterval(t);
  }, [player, trim]);

  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  // A song to preview under the video (the mix is made when you post).
  const musicPlayer = useVideoPlayer(music?.uri ?? null, (p) => {
    p.loop = true;
    p.play();
  });
  useEffect(() => {
    player.volume = music ? music.volumeOriginal : 1;
    if (music) musicPlayer.volume = music.volumeMusic;
  }, [music, player, musicPlayer]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const patch = (id: string, changes: Partial<OverlayItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  const remove = (id: string) => {
    setItems((list) => list.filter((i) => i.id !== id));
    setSelectedId(null);
  };

  const openTool = (key: Exclude<Panel, 'music' | null>) => {
    if (key === 'text' && !(selected && selected.kind === 'text')) {
      const item: OverlayItem = { id: uid(), kind: 'text', text: 'Tap to edit', color: '#FFFFFF', size: 26, x: 0.5, y: 0.45 };
      setItems((l) => [...l, item]);
      setSelectedId(item.id);
    }
    setPanel((p) => (p === key ? null : key));
  };

  const addSticker = (emoji: string) => {
    const item: OverlayItem = { id: uid(), kind: 'sticker', text: emoji, color: '#FFFFFF', size: 56, x: 0.5, y: 0.5 };
    setItems((l) => [...l, item]);
    setSelectedId(item.id);
  };

  const pickMusic = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setMusic({ uri: a.uri, name: (a.name ?? 'Song').replace(/\.[^.]+$/, ''), mimeType: a.mimeType ?? 'audio/mpeg', volumeOriginal: 1, volumeMusic: 0.8 });
    setPanel('music');
  };

  const togglePlay = () => {
    if (playing) {
      player.pause();
      musicPlayer.pause();
    } else {
      player.play();
      if (music) musicPlayer.play();
    }
    setPlaying(!playing);
  };

  const next = async () => {
    const [start, end] = trim;
    if (end - start < 1000) return Alert.alert('Too short', 'The video needs to be at least 1 second long.');
    player.pause();
    musicPlayer.pause();
    let overlayUri: string | null = null;
    if (items.length > 0) {
      // One see-through picture of all the text and stickers, exactly as placed.
      setCapturing(true);
      setSelectedId(null);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
      try {
        overlayUri = await captureRef(overlayRef, { format: 'png', quality: 1, result: 'tmpfile', width: 720, height: 1280 });
      } catch {
        setCapturing(false);
        return Alert.alert("Couldn't add your text and stickers", 'Please try again.');
      }
      setCapturing(false);
    }
    navigation.navigate('VideoPublish', {
      uri,
      durationMs: duration,
      trimStartMs: start,
      trimEndMs: end,
      speed,
      filter,
      effect,
      overlayUri,
      music: music ? { uri: music.uri, name: music.name, mimeType: music.mimeType, volumeOriginal: music.volumeOriginal, volumeMusic: music.volumeMusic } : null,
    });
  };

  const tint = FILTERS.find((f) => f.key === filter)?.tint ?? null;
  const plain = isPlainPost({ trimStartMs: trim[0], trimEndMs: trim[1], speed, filter, effect }, duration, items.length > 0, !!music);

  return (
    <View style={styles.root}>
      {/* The 9:16 canvas: video, then a rough filter tint, then your text and stickers */}
      <Pressable
        style={[styles.canvas, { width: cw, height: ch }]}
        onPress={() => {
          setSelectedId(null);
          setPanel(null);
        }}
      >
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={canvasFit(aspect)} nativeControls={false} />
        {tint && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />}
        <View ref={overlayRef} collapsable={false} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {items.map((item) => (
            <OverlayItemView
              key={item.id}
              item={item}
              canvasWidth={cw}
              canvasHeight={ch}
              selected={item.id === selectedId}
              capturing={capturing}
              onSelect={() => {
                setSelectedId(item.id);
                setPanel(item.kind === 'text' ? 'text' : 'sticker');
              }}
              onMove={(x, y) => patch(item.id, { x, y })}
            />
          ))}
        </View>
      </Pressable>

      {/* Top: back, and the music pill */}
      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        <Pressable style={styles.musicPill} onPress={() => (music ? setPanel('music') : pickMusic())}>
          <Ionicons name="musical-notes" size={16} color="#FFF" />
          <Text style={styles.musicText} numberOfLines={1}>
            {music ? music.name : 'Add music'}
          </Text>
          {music && (
            <Pressable
              hitSlop={10}
              onPress={() => {
                setMusic(null);
                setPanel(null);
              }}
            >
              <Ionicons name="close" size={16} color="#FFF" />
            </Pressable>
          )}
        </Pressable>
        <View style={{ width: 44 }} />
      </View>

      {/* Tools down the right */}
      <View style={[styles.tools, { top: insets.top + 70 }]}>
        {TOOLS.map((t) => (
          <Pressable key={t.key} style={styles.tool} onPress={() => openTool(t.key)}>
            <Ionicons name={t.icon} size={28} color={panel === t.key ? '#FF6FA5' : '#FFF'} />
            <Text style={[styles.toolText, panel === t.key && { color: '#FF6FA5' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.playBtn, { top: ch - 84 }]} onPress={togglePlay} hitSlop={10}>
        <Ionicons name={playing ? 'pause' : 'play'} size={26} color="#FFF" />
      </Pressable>

      {/* Bottom: progress and the arrow to continue */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.nextRow}>
          <Text style={styles.hint}>
            {fmt(trim[1] - trim[0])}
            {speed !== 1 ? `  ·  ${speed}×` : ''}
            {plain ? '  ·  no edits' : ''}
          </Text>
          <Pressable style={styles.nextBtn} onPress={next} disabled={capturing} accessibilityLabel="Continue">
            <Ionicons name="arrow-forward" size={26} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Tool panels */}
      {panel && (
        <View style={[styles.panel, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>{{ edit: 'Edit', text: 'Text', sticker: 'Stickers', effects: 'Effects', filters: 'Filters', music: 'Music' }[panel]}</Text>
            <Pressable hitSlop={10} onPress={() => setPanel(null)}>
              <Ionicons name="checkmark" size={24} color="#FFF" />
            </Pressable>
          </View>

          {panel === 'edit' && (
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Start  {fmt(trim[0])}</Text>
              <Slider
                minimumValue={0}
                maximumValue={Math.max(1, duration)}
                value={trim[0]}
                minimumTrackTintColor="#FF2E7E"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#FF2E7E"
                onValueChange={(v) => setTrim(([, e]) => [Math.min(v, e - 1000), e])}
                onSlidingComplete={(v) => {
                  const s = Math.max(0, Math.min(v, trim[1] - 1000));
                  setTrim([s, trim[1]]);
                  player.currentTime = s / 1000;
                }}
              />
              <Text style={styles.label}>End  {fmt(trim[1])}</Text>
              <Slider
                minimumValue={0}
                maximumValue={Math.max(1, duration)}
                value={trim[1]}
                minimumTrackTintColor="#FF2E7E"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#FF2E7E"
                onValueChange={(v) => setTrim(([s]) => [s, Math.max(v, s + 1000)])}
                onSlidingComplete={(v) => setTrim(([s]) => [s, Math.min(Math.max(v, s + 1000), duration || v)])}
              />
              <Text style={styles.label}>Speed</Text>
              <View style={styles.chips}>
                {SPEEDS.map((s) => (
                  <Pressable key={s} onPress={() => setSpeed(s)} style={[styles.chip, speed === s && styles.chipOn]}>
                    <Text style={styles.chipText}>{s}×</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {panel === 'text' && (
            <View style={{ gap: 10 }}>
              {selected && selected.kind === 'text' ? (
                <>
                  <TextInput style={styles.input} value={selected.text} onChangeText={(t) => patch(selected.id, { text: t })} maxLength={60} placeholder="Type your text" placeholderTextColor="rgba(255,255,255,0.5)" />
                  <View style={styles.chips}>
                    {TEXT_COLORS.map((c) => (
                      <Pressable key={c} onPress={() => patch(selected.id, { color: c })} style={[styles.swatch, { backgroundColor: c }, selected.color === c && styles.swatchOn]} />
                    ))}
                  </View>
                  <Slider minimumValue={16} maximumValue={64} value={selected.size} minimumTrackTintColor="#FF2E7E" maximumTrackTintColor="rgba(255,255,255,0.3)" thumbTintColor="#FF2E7E" onValueChange={(v) => patch(selected.id, { size: Math.round(v) })} />
                  <Pressable style={styles.deleteBtn} onPress={() => remove(selected.id)}>
                    <Ionicons name="trash-outline" size={16} color="#FF7A8A" />
                    <Text style={styles.deleteText}>Delete this text</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.label}>Tap a text on the video to change it, or drag it to move it.</Text>
              )}
            </View>
          )}

          {panel === 'sticker' && (
            <View style={{ gap: 10 }}>
              <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={styles.grid}>
                {STICKERS.map((s) => (
                  <Pressable key={s} onPress={() => addSticker(s)} style={styles.stickerCell}>
                    <Text style={{ fontSize: 30 }}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              {selected && selected.kind === 'sticker' && (
                <>
                  <Slider minimumValue={28} maximumValue={140} value={selected.size} minimumTrackTintColor="#FF2E7E" maximumTrackTintColor="rgba(255,255,255,0.3)" thumbTintColor="#FF2E7E" onValueChange={(v) => patch(selected.id, { size: Math.round(v) })} />
                  <Pressable style={styles.deleteBtn} onPress={() => remove(selected.id)}>
                    <Ionicons name="trash-outline" size={16} color="#FF7A8A" />
                    <Text style={styles.deleteText}>Delete this sticker</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          {panel === 'effects' && (
            <>
              <View style={styles.chips}>
                {EFFECTS.map((e) => (
                  <Pressable key={e.key} onPress={() => setEffect(e.key)} style={[styles.bigChip, effect === e.key && styles.chipOn]}>
                    <Text style={{ fontSize: 22 }}>{e.icon}</Text>
                    <Text style={styles.chipText}>{e.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.note}>Effects are added when you post, so they don't show in this preview.</Text>
            </>
          )}

          {panel === 'filters' && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {FILTERS.map((f) => (
                  <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.bigChip, filter === f.key && styles.chipOn]}>
                    <View style={[styles.filterDot, { backgroundColor: f.tint ?? 'rgba(255,255,255,0.25)' }]} />
                    <Text style={styles.chipText}>{f.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.note}>The preview is only a rough hint of the colour. The finished video has the exact look.</Text>
            </>
          )}

          {panel === 'music' && music && (
            <View style={{ gap: 6 }}>
              <Text style={styles.label} numberOfLines={1}>
                ♫ {music.name}
              </Text>
              <Text style={styles.label}>Music volume</Text>
              <Slider minimumValue={0} maximumValue={1} value={music.volumeMusic} minimumTrackTintColor="#FF2E7E" maximumTrackTintColor="rgba(255,255,255,0.3)" thumbTintColor="#FF2E7E" onValueChange={(v) => setMusic((m) => (m ? { ...m, volumeMusic: v } : m))} />
              <Text style={styles.label}>Original sound volume</Text>
              <Slider minimumValue={0} maximumValue={1} value={music.volumeOriginal} minimumTrackTintColor="#FF2E7E" maximumTrackTintColor="rgba(255,255,255,0.3)" thumbTintColor="#FF2E7E" onValueChange={(v) => setMusic((m) => (m ? { ...m, volumeOriginal: v } : m))} />
              <Pressable style={styles.deleteBtn} onPress={pickMusic}>
                <Ionicons name="swap-horizontal" size={16} color="#FFF" />
                <Text style={[styles.deleteText, { color: '#FFF' }]}>Choose a different song</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12141C' },
  canvas: { backgroundColor: '#000', overflow: 'hidden' },
  top: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  musicPill: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '60%', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  musicText: { color: '#FFF', fontWeight: '700', fontSize: 15, flexShrink: 1 },
  tools: { position: 'absolute', right: 8, gap: 18, alignItems: 'center' },
  tool: { alignItems: 'center', gap: 2, width: 64 },
  toolText: { color: '#FFF', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
  playBtn: { position: 'absolute', right: 16, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(60,60,60,0.75)', alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#12141C', paddingTop: 10 },
  track: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 6 },
  trackFill: { height: 3, backgroundColor: '#FFF' },
  nextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  nextBtn: { width: 84, height: 52, borderRadius: 26, backgroundColor: '#5B5BFF', alignItems: 'center', justifyContent: 'center' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,18,32,0.97)', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 14, zIndex: 20, elevation: 20 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  panelTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  note: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 10, lineHeight: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  chipOn: { backgroundColor: '#FF2E7E' },
  chipText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  bigChip: { minWidth: 76, alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
  filterDot: { width: 28, height: 28, borderRadius: 14 },
  input: { height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFF', paddingHorizontal: 14, fontSize: 15 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  swatchOn: { borderColor: '#FFF', borderWidth: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  stickerCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  deleteText: { color: '#FF7A8A', fontWeight: '800', fontSize: 13 },
});
