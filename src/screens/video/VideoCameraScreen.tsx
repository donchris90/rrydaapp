import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIMITS = [15, 60] as const;

// Record a video with the camera (flip, torch, 15 s or 60 s, one big record button)
// or pick one from the gallery — either way it goes on to the editor.
export function VideoCameraScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const camera = useRef<CameraView>(null);
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [torch, setTorch] = useState(false);
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(60);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [ready, setReady] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    if (camPerm && !camPerm.granted && camPerm.canAskAgain) requestCam();
    if (micPerm && !micPerm.granted && micPerm.canAskAgain) requestMic();
  }, [camPerm, micPerm, requestCam, requestMic]);

  // The clock while recording; recording stops on its own at the chosen length.
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [recording]);

  const goEdit = (uri: string, durationMs: number, width?: number, height?: number) => navigation.replace('VideoEditor', { uri, durationMs, width, height });

  const toggleRecord = async () => {
    if (!camera.current || !ready) return;
    if (recording) {
      camera.current.stopRecording();
      return;
    }
    setSeconds(0);
    startedAt.current = Date.now();
    setRecording(true);
    try {
      const result = await camera.current.recordAsync({ maxDuration: limit });
      const durationMs = Date.now() - startedAt.current;
      if (result?.uri) goEdit(result.uri, Math.min(durationMs, limit * 1000));
    } catch (e: any) {
      Alert.alert("Couldn't record", e?.message ?? 'Please try again.');
    } finally {
      setRecording(false);
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1, videoMaxDuration: 600 });
    const asset = res.canceled ? null : res.assets[0];
    if (asset) goEdit(asset.uri, asset.duration ?? 0, asset.width, asset.height);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!camPerm || !micPerm) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFF" />
      </View>
    );
  }

  if (!camPerm.granted || !micPerm.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={44} color="rgba(255,255,255,0.7)" />
        <Text style={styles.permText}>Allow the camera and microphone to record a video.</Text>
        <Pressable style={styles.permBtn} onPress={() => (camPerm.canAskAgain && micPerm.canAskAgain ? (requestCam(), requestMic()) : Linking.openSettings())}>
          <Text style={styles.permBtnText}>{camPerm.canAskAgain && micPerm.canAskAgain ? 'Allow access' : 'Open settings'}</Text>
        </Pressable>
        <Pressable style={[styles.permBtn, { backgroundColor: 'rgba(255,255,255,0.14)' }]} onPress={pickFromGallery}>
          <Text style={styles.permBtnText}>Choose from gallery instead</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ marginTop: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {focused && <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} mode="video" enableTorch={torch && facing === 'back'} videoQuality="720p" onCameraReady={() => setReady(true)} />}

      <View style={[styles.top, { top: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn} disabled={recording}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        {recording && (
          <View style={styles.timer}>
            <View style={styles.dot} />
            <Text style={styles.timerText}>
              {fmt(seconds)} / {fmt(limit)}
            </Text>
          </View>
        )}
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.rail, { top: insets.top + 70 }]}>
        <Pressable style={styles.railBtn} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} disabled={recording}>
          <Ionicons name="camera-reverse-outline" size={28} color="#FFF" />
          <Text style={styles.railText}>Flip</Text>
        </Pressable>
        <Pressable style={styles.railBtn} onPress={() => setTorch((t) => !t)} disabled={facing === 'front'}>
          <Ionicons name={torch ? 'flash' : 'flash-off-outline'} size={28} color={facing === 'front' ? 'rgba(255,255,255,0.35)' : '#FFF'} />
          <Text style={styles.railText}>{torch ? 'Flash On' : 'Flash Off'}</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.limits}>
          {LIMITS.map((l) => (
            <Pressable key={l} onPress={() => !recording && setLimit(l)} style={[styles.limit, limit === l && styles.limitActive]}>
              <Text style={[styles.limitText, limit === l && styles.limitTextActive]}>{l}s</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.controls}>
          <View style={{ width: 90 }} />
          <Pressable onPress={toggleRecord} disabled={!ready} accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}>
            <View style={styles.ring}>
              <View style={[styles.recordCore, recording && styles.recordCoreOn]} />
            </View>
          </Pressable>
          <Pressable style={styles.gallery} onPress={pickFromGallery} disabled={recording}>
            <View style={styles.galleryBox}>
              <Ionicons name="images" size={22} color="#FFF" />
            </View>
            <Text style={styles.galleryText}>Upload Video</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 },
  permText: { color: '#FFF', textAlign: 'center', fontSize: 15, lineHeight: 21 },
  permBtn: { backgroundColor: '#FF2E7E', borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 },
  permBtnText: { color: '#FFF', fontWeight: '900' },
  top: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF3B4E' },
  timerText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  rail: { position: 'absolute', right: 10, gap: 20, alignItems: 'center' },
  railBtn: { alignItems: 'center', gap: 2, width: 64 },
  railText: { color: '#FFF', fontSize: 11, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 18 },
  limits: { flexDirection: 'row', gap: 10 },
  limit: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  limitActive: { backgroundColor: '#FFF' },
  limitText: { color: '#FFF', fontWeight: '800' },
  limitTextActive: { color: '#000' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 24 },
  ring: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  recordCore: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF2D55' },
  recordCoreOn: { width: 34, height: 34, borderRadius: 8 },
  gallery: { width: 90, alignItems: 'center', gap: 4 },
  galleryBox: { width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  galleryText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
