import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { RtcSurfaceView, type RtcConnection } from 'react-native-agora';
import { colors } from '../theme';

// uid: 0 is the SDK's own convention for "render my local preview" —
// verified against RtcSurfaceView's real props (VideoCanvas.uid) rather
// than assumed; a remote uid comes from useAgoraEngine's onUserJoined.
//
// connection is optional and only needed for a secondary channel (PK
// battles — watching an opponent's channel alongside your own, joined
// via joinChannelEx). Verified RtcSurfaceView genuinely accepts this
// prop from the SDK's real type definitions before adding it here, not
// assumed. Omitting it (every existing call site) renders from whichever
// channel was joined with the plain joinChannel/joinChannelWithUserAccount call.
export function AgoraVideoView({
  uid,
  style,
  connection,
}: {
  uid: number;
  style?: ViewStyle;
  connection?: RtcConnection;
}) {
  return (
    <View style={[styles.container, style]}>
      <RtcSurfaceView canvas={{ uid }} connection={connection} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bgDeepest, overflow: 'hidden' },
});

