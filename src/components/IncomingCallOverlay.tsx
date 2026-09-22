import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIncomingCallListener } from '../live/useIncomingCallListener';
import { useDirectMessagePush } from '../live/useDirectMessagePush';
import { declineCall } from '../api/calls';
import { Avatar } from './Avatar';
import { colors, radii, spacing, type } from '../theme';
import type { AppStackParamList } from '../navigation/types';

// Rendered once, at the app root (alongside the Stack.Navigator, not
// inside any one screen) — an incoming call can arrive while the user
// is anywhere in the app, so this can't live inside ConversationScreen
// or any single route. For the same reason it also hosts the app-wide
// direct-message push listener (it renders nothing for that).
export function IncomingCallOverlay() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { incomingCall, dismissIncomingCall } = useIncomingCallListener();
  useDirectMessagePush();

  if (!incomingCall) return null;

  const handleAccept = () => {
    const call = incomingCall;
    dismissIncomingCall();
    navigation.navigate('Call', {
      callId: call.callId,
      otherUserId: call.callerId,
      otherUserDisplayName: call.callerDisplayName,
      isIncoming: true,
    });
  };

  const handleDecline = () => {
    declineCall(incomingCall.callId).catch(() => {});
    dismissIncomingCall();
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Avatar name={incomingCall.callerDisplayName} size={72} />
          <Text style={styles.name}>{incomingCall.callerDisplayName ?? 'Someone'}</Text>
          <Text style={styles.subtitle}>Incoming video call</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.declineButton]} onPress={handleDecline}>
              <Ionicons name="close" size={26} color="#FFF" />
            </Pressable>
            <Pressable style={[styles.button, styles.acceptButton]} onPress={handleAccept}>
              <Ionicons name="videocam" size={26} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  name: { ...type.h2, color: colors.textPrimary, marginTop: spacing.sm },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.xl },
  button: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  acceptButton: { backgroundColor: '#1FD174' },
  declineButton: { backgroundColor: colors.danger },
});
