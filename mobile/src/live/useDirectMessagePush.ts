import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_BASE_URL } from '../config';
import { getAccessToken } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { DirectMessage } from '../api/messages';
import { dispatchTyping, setDmSocket, type TypingEvent } from './dmSocketBus';

// App-wide, like useIncomingCallListener (and mounted next to it): a DM can
// arrive while the user is on any screen, not just an open conversation.
// Rather than hand state to individual screens, it writes straight into the
// react-query cache the Inbox and Conversation screens already read, so
// both update with no per-screen socket.
//
// Uses the per-user socket room the backend auto-joins on connect (see
// realtime.gateway.ts handleConnection) — nothing to join here.
export function useDirectMessagePush() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(SOCKET_BASE_URL, {
      auth: { token: getAccessToken() },
      transports: ['websocket'],
    });

    setDmSocket(socket);

    let hasConnectedBefore = false;
    socket.on('connect', () => {
      // The backend doesn't replay events, so anything sent while the
      // socket was down is fetched instead.
      if (hasConnectedBefore) queryClient.invalidateQueries({ queryKey: ['messages'] });
      hasConnectedBefore = true;
    });

    socket.on('dm:typing', (event: TypingEvent) => dispatchTyping(event));

    // A new notification (gift, PK result, payout, ...) was created for this
    // user — refresh the inbox instead of waiting for its slow poll.
    socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Someone challenged this user to a PK: refresh so the on-screen banner shows
    // at once instead of waiting for the next poll.
    socket.on('pk:challenge', () => {
      queryClient.invalidateQueries({ queryKey: ['pk', 'incoming'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('dm:message', (message: DirectMessage) => {
      const me = userIdRef.current;
      const otherId = message.senderId === me ? message.recipientId : message.senderId;

      // A message from them means they've finished typing it.
      if (message.senderId !== me) dispatchTyping({ fromUserId: message.senderId, typing: false });

      // Append to an already-open (or cached) conversation, deduping by id:
      // the sender also gets this event, and their own send mutation
      // refetches too. A conversation that isn't cached is simply loaded
      // fresh when opened.
      queryClient.setQueryData<DirectMessage[] | undefined>(['messages', 'with', otherId], (prev) => {
        if (!prev) return prev;
        return prev.some((m) => m.id === message.id) ? prev : [...prev, message];
      });

      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      if (message.senderId !== me) queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      setDmSocket(null);
      socket.disconnect();
    };
  }, [isAuthenticated, queryClient]);
}
