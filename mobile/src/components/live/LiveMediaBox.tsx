import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { LiveMediaAction, LiveMediaState } from '../../api/liveMedia';
import { DRIFT_TOLERANCE_MS, expectedPositionMs, needsSeek } from '../../live/mediaSync';

interface Props {
  state: LiveMediaState;
  // When this message reached THIS phone (Date.now()), to line up with the server's clock.
  receivedAt: number;
  isHost: boolean;
  top: number;
  // Host only: called when the host presses a control (and with the position for the heartbeat).
  onAction?: (action: LiveMediaAction, positionMs?: number) => void;
}

// A video shared in a live, shown as a 16:9 box under the header — the host's
// camera stays below it. The host's phone is the master: it plays, and everyone
// else's phone plays the SAME video, keeping in step with the host's position (sent
// by the server) and jumping back into line if it drifts more than 1.5 seconds.
// Mount it with key={state.videoId} so a different video gets a fresh player.
export function LiveMediaBox({ state, receivedAt, isHost, top, onAction }: Props) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(state.url, (p) => {
    p.loop = false;
  });

  // Follow the server's state whenever it changes.
  useEffect(() => {
    const expected = expectedPositionMs(state, receivedAt, Date.now());
    if (needsSeek(player.currentTime * 1000, expected)) player.currentTime = expected / 1000;
    if (state.status === 'PLAYING') player.play();
    else player.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, receivedAt]);

  // Viewers: quietly pull back into line if the video drifts or stalls.
  useEffect(() => {
    if (isHost || state.status !== 'PLAYING') return;
    const t = setInterval(() => {
      const expected = expectedPositionMs(state, receivedAt, Date.now());
      if (needsSeek(player.currentTime * 1000, expected, DRIFT_TOLERANCE_MS)) player.currentTime = expected / 1000;
      if (!player.playing) player.play();
    }, 4000);
    return () => clearInterval(t);
  }, [isHost, state, receivedAt, player]);

  // Host: tell the server where the video really is now and then, so a viewer who
  // joins late (or whose connection stalled) lands in the right place.
  useEffect(() => {
    if (!isHost || state.status !== 'PLAYING' || !onAction) return;
    const t = setInterval(() => onAction('sync', Math.round(player.currentTime * 1000)), 8000);
    return () => clearInterval(t);
  }, [isHost, state.status, onAction, player]);

  // Host: when the video finishes, leave it paused at the end.
  useEventListener(player, 'playToEnd', () => {
    if (isHost) onAction?.('pause', Math.round((player.duration || player.currentTime) * 1000));
  });

  const ms = () => Math.round(player.currentTime * 1000);
  const togglePlay = () => {
    if (state.status === 'PLAYING') {
      player.pause();
      onAction?.('pause', ms());
    } else {
      player.play();
      onAction?.('play', ms());
    }
  };
  const jump = (deltaMs: number) => {
    const next = Math.max(0, ms() + deltaMs);
    player.currentTime = next / 1000;
    onAction?.('seek', next);
  };

  return (
    <View style={[styles.box, { top, height: Math.round((width * 9) / 16) }]} pointerEvents="box-none">
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      <View style={styles.titleChip} pointerEvents="none">
        <Ionicons name="film" size={12} color="#FFF" />
        <Text style={styles.titleText} numberOfLines={1}>
          {state.title}
        </Text>
      </View>

      {isHost ? (
        <View style={styles.controls}>
          <Pressable onPress={() => jump(-10_000)} hitSlop={8} style={styles.ctrl} accessibilityLabel="Back 10 seconds">
            <Ionicons name="play-back" size={20} color="#FFF" />
          </Pressable>
          <Pressable onPress={togglePlay} hitSlop={8} style={[styles.ctrl, styles.ctrlMain]} accessibilityLabel={state.status === 'PLAYING' ? 'Pause' : 'Play'}>
            <Ionicons name={state.status === 'PLAYING' ? 'pause' : 'play'} size={22} color="#FFF" />
          </Pressable>
          <Pressable onPress={() => jump(10_000)} hitSlop={8} style={styles.ctrl} accessibilityLabel="Forward 10 seconds">
            <Ionicons name="play-forward" size={20} color="#FFF" />
          </Pressable>
          <Pressable onPress={() => onAction?.('stop')} hitSlop={8} style={[styles.ctrl, styles.ctrlStop]} accessibilityLabel="Stop sharing the video">
            <Ionicons name="close" size={20} color="#FFF" />
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.muteBtn} onPress={() => (player.muted = !player.muted)} hitSlop={8} accessibilityLabel="Mute the video">
          <Ionicons name="volume-high" size={18} color="#FFF" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, right: 0, zIndex: 5, backgroundColor: '#000' },
  titleChip: { position: 'absolute', top: 6, left: 8, flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '70%', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  titleText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14 },
  ctrl: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  ctrlMain: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF2E7E' },
  ctrlStop: { backgroundColor: 'rgba(229,56,79,0.85)' },
  muteBtn: { position: 'absolute', right: 8, bottom: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
