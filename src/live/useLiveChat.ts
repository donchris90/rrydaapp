import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config';
import { getAccessToken } from '../api/client';

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface GiftEvent {
  senderId: string;
  recipientId: string;
  giftId: string;
  coinAmount: number;
}

// Matches realtime.gateway.ts's real event contract exactly — 'join' with
// {context, contextId} to enter the room, 'chat:send' to post, 'chat:message'
// broadcast back to everyone in it (including the sender — the gateway
// doesn't special-case excluding the sender's own socket, so this doesn't
// either; a message reflects back and is appended once). Not a REST
// polling loop like the rest of this app's data fetching — this is the
// one place a real persistent socket connection is actually the right
// tool, since chat has no natural "poll every N seconds" cadence.
export function useLiveChat(context: 'LIVE' | 'ROOM', contextId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [giftEvents, setGiftEvents] = useState<GiftEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!contextId) return;

    const token = getAccessToken();
    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ['websocket'], // skip the polling-upgrade dance — a live room's socket is expected to be persistent for the whole visit, not a short-lived request
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { context, contextId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('chat:message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    // Now genuinely fires — see economy.controller.ts's GiftController.send(),
    // which previously never called the gateway's broadcastGift() at all
    // despite it existing. Keeps only the last few — this is meant for a
    // brief on-screen announcement, not a growing list to scroll through.
    socket.on('gift:sent', (event: GiftEvent) => {
      setGiftEvents((prev) => [...prev.slice(-4), event]);
    });

    return () => {
      socket.emit('leave', { context, contextId });
      socket.disconnect();
      socketRef.current = null;
      setMessages([]);
      setIsConnected(false);
    };
  }, [context, contextId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      socketRef.current?.emit('chat:send', { context, contextId, content: content.trim() });
    },
    [context, contextId],
  );

  return { messages, giftEvents, isConnected, sendMessage };
}
