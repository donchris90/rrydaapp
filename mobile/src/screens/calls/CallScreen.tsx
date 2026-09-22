import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchCallStatus, acceptCall, endCall, joinCall } from '../../api/calls';
import { useAuth } from '../../auth/AuthContext';
import { useAgoraEngine } from '../../live/useAgoraEngine';
import { useIncomingCallListener } from '../../live/useIncomingCallListener';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { Avatar } from '../../components/Avatar';
import { colors, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type CallRouteProp = RouteProp<AppStackParamList, 'Call'>;

// Real 1-on-1 video calling — both sides publish (unlike Live's one-way
// broadcast), reusing the exact same useAgoraEngine hook Live/pre-Live
// already use rather than a third implementation, since a 2-person call
// is architecturally the same problem: one local preview, one remote
// feed, both with camera+mic live.
export function CallScreen() {
  const navigation = useNavigation();
  const route = useRoute<CallRouteProp>();
  const { callId, otherUserId, otherUserDisplayName, isIncoming } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { remoteCallEvent, clearRemoteCallEvent } = useIncomingCallListener();

  const [channel, setChannel] = useState<{ channelId: string; token: string } | null>(null);

  const statusQuery = useQuery({
    queryKey: ['calls', callId],
    queryFn: () => fetchCallStatus(callId),
    // Polled as a fallback/reconciliation check, same reasoning as
    // messages — the real-time socket event is the primary signal (see
    // the effect below), this just guards against a missed event.
    refetchInterval: (query) => (query.state.data?.status === 'RINGING' ? 2000 : false),
  });
  const call = statusQuery.data;

  const acceptMutation = useMutation({ mutationFn: () => acceptCall(callId) });
  const endMutation = useMutation({ mutationFn: () => endCall(callId) });

  // Real-time-first: reacts to the actual socket event rather than
  // waiting for the next poll tick to notice the call was accepted.
  useEffect(() => {
    if (remoteCallEvent?.callId !== callId) return;
    if (remoteCallEvent.type === 'accepted') {
      statusQuery.refetch();
    } else if (remoteCallEvent.type === 'declined' || remoteCallEvent.type === 'ended' || remoteCallEvent.type === 'missed') {
      clearRemoteCallEvent();
      Alert.alert(
        remoteCallEvent.type === 'declined' ? 'Call declined' : 'Call ended',
        `${otherUserDisplayName ?? 'The other person'} ${remoteCallEvent.type === 'declined' ? 'declined the call' : 'left the call'}.`,
      );
      navigation.goBack();
    }
  }, [remoteCallEvent]);

  const isAccepted = call?.status === 'ACCEPTED';

  // Only join the actual RTC channel once the call is genuinely
  // accepted — joining earlier would mean paying for/spinning up video
  // for a call nobody has agreed to yet.
  useEffect(() => {
    if (!isAccepted || channel) return;
    joinCall(callId).then((result) => setChannel({ channelId: result.call.providerChannel, token: result.token }));
  }, [isAccepted, channel]);

  const { remoteUid, error, isMicMuted, toggleMic, switchCamera } = useAgoraEngine({
    channelId: channel?.channelId ?? '',
    token: channel?.token ?? '',
    userAccount: user?.id ?? '',
    role: 'host',
  });

  const handleAccept = () => acceptMutation.mutate();
  const handleEnd = () => {
    endMutation.mutate();
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      {isAccepted && remoteUid != null ? (
        <AgoraVideoView uid={remoteUid} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.waitingBg]} />
      )}

      {isAccepted && (
        <View style={styles.localPreviewWrap}>
          <AgoraVideoView uid={0} style={StyleSheet.absoluteFill} />
        </View>
      )}

      <View style={[styles.topInfo, { paddingTop: insets.top + spacing.md }]}>
        {(!isAccepted || remoteUid == null) && <Avatar name={otherUserDisplayName} size={88} />}
        <Text style={styles.name}>{otherUserDisplayName ?? 'User'}</Text>
        <Text style={styles.statusText}>
          {!call ? 'Connecting...' : call.status === 'RINGING' ? (isIncoming ? 'Incoming video call' : 'Ringing...') : isAccepted ? (remoteUid != null ? 'Connected' : 'Waiting for video...') : call.status}
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        {call?.status === 'RINGING' && isIncoming ? (
          <View style={styles.ringingRow}>
            <Pressable style={[styles.callButton, styles.declineButton]} onPress={handleEnd}>
              <Ionicons name="close" size={28} color="#FFF" />
            </Pressable>
            <Pressable style={[styles.callButton, styles.acceptButton]} onPress={handleAccept}>
              <Ionicons name="videocam" size={28} color="#FFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.inCallRow}>
            {isAccepted && (
              <>
                <Pressable style={styles.smallButton} onPress={toggleMic}>
                  <Ionicons name={isMicMuted ? 'mic-off' : 'mic'} size={22} color="#FFF" />
                </Pressable>
                <Pressable style={styles.smallButton} onPress={switchCamera}>
                  <Ionicons name="camera-reverse-outline" size={22} color="#FFF" />
                </Pressable>
              </>
            )}
            <Pressable style={[styles.callButton, styles.declineButton]} onPress={handleEnd}>
              <Ionicons name="call" size={26} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0820' },
  waitingBg: { backgroundColor: '#0D0820' },
  localPreviewWrap: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    width: 100,
    height: 140,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  topInfo: { alignItems: 'center', paddingHorizontal: spacing.lg },
  name: { ...type.h1, color: '#FFF', marginTop: spacing.md },
  statusText: { ...type.body, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  errorText: { ...type.caption, color: colors.danger, marginTop: spacing.xs, textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  ringingRow: { flexDirection: 'row', gap: spacing.xxl, alignItems: 'center' },
  inCallRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  callButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  acceptButton: { backgroundColor: '#1FD174' },
  declineButton: { backgroundColor: colors.danger },
  smallButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
