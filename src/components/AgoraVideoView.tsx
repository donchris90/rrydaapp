import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';
import { colors } from '../theme';

// uid: 0 is the SDK's own convention for "render my local preview" —
// verified against RtcSurfaceView's real props (VideoCanvas.uid) rather
// than assumed; a remote uid comes from useAgoraEngine's onUserJoined.
export function AgoraVideoView({ uid, style }: { uid: number; style?: ViewStyle }) {
  return (
    <View style={[styles.container, style]}>
      <RtcSurfaceView canvas={{ uid }} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bgDeepest, overflow: 'hidden' },
});
