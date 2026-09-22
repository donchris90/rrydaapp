import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config';
import { getAccessToken } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export interface IncomingCall {
  callId: string;
  callerId: string;
  callerDisplayName: string | null;
}

// Unlike useLiveChat's socket (connects/disconnects per screen, tied to
// joining a specific room/live context), this one is intentionally
// app-wide — an incoming call can arrive while the user is anywhere in
// the app, not just while a Conversation screen happens to be open. It
// connects once the user is authenticated and stays connected for the
// whole session, joining nothing itself (the backend already auto-joins
// every authenticated socket to its own personal room on connection —
// see realtime.gateway.ts's handleConnection).
export function useIncomingCallListener() {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  // Fires when the *other* party ends/declines/misses a call this device
  // is currently on a CallScreen for — the screen listens for this to
  // know when to leave automatically rather than the local user having
  // to notice the channel went quiet.
  const [remoteCallEvent, setRemoteCallEvent] = useState<{ callId: string; type: 'accepted' | 'declined' | 'ended' | 'missed' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const token = getAccessToken();
    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('call:incoming', (data: IncomingCall) => setIncomingCall(data));
    socket.on('call:accepted', (data: { callId: string }) => setRemoteCallEvent({ ...data, type: 'accepted' }));
    socket.on('call:declined', (data: { callId: string }) => setRemoteCallEvent({ ...data, type: 'declined' }));
    socket.on('call:ended', (data: { callId: string }) => setRemoteCallEvent({ ...data, type: 'ended' }));
    socket.on('call:missed', (data: { callId: string }) => setRemoteCallEvent({ ...data, type: 'missed' }));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const dismissIncomingCall = () => setIncomingCall(null);
  const clearRemoteCallEvent = () => setRemoteCallEvent(null);

  return { incomingCall, dismissIncomingCall, remoteCallEvent, clearRemoteCallEvent };
}
