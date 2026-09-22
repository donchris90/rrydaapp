import type { LiveMediaMessage } from '../api/liveMedia';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config';
import { getAccessToken } from '../api/client';
import { fetchChatHistory, fetchLiveSummary, likeLiveSession } from '../api/live';
import type { PkLifecycleEvent } from './usePkScoreSocket';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string | null;
  content: string;
  createdAt: string;
  // True for the gateway's own "X joined" arrival notice — never something
  // a real sender posted, so the feed can style it as a system line instead
  // of a comment from a user named "system".
  system?: boolean;
}

// Pushed by the backend on 'room:moderation' (ROOM context only) to the
// whole room and to the target user directly.
export interface RoomModerationEvent {
  roomId?: string;
  sessionId?: string;
  action: 'MUTE' | 'UNMUTE' | 'BAN' | 'UNBAN' | 'KICK';
  targetUserId: string;
  actorId: string;
}

export interface UseLiveChatOptions {
  // LIVE context only: the host loaded, played, paused, moved or stopped a shared video.
  onMedia?: (message: LiveMediaMessage) => void;
  onModeration?: (event: RoomModerationEvent) => void;
  // ROOM context only: the host changed the room's theme color.
  onRoomTheme?: (event: { roomId: string; themeColor: string }) => void;
  // LIVE context only: PK lifecycle pushed to everyone watching either
  // participant's stream (countdown start, battle active, settled).
  onPkEvent?: (name: 'pk:countdown_start' | 'pk:active' | 'pk:settled', event: PkLifecycleEvent) => void;
}

export interface GiftEvent {
  id?: string;
  senderId: string;
  senderName?: string | null;
  senderAvatarUrl?: string | null;
  recipientId: string;
  recipientName?: string | null;
  giftId: string;
  giftName?: string | null;
  // The gift's emoji, so a screen can animate it without another lookup.
  giftIcon?: string | null;
  coinAmount: number;
}

// Batches rapid like-taps into one request. The server also caps a single
// request at 20 and rate-limits per user, so this stays well inside it.
const LIKE_FLUSH_MS = 400;

// Merge history + live socket messages: dedupe by id (a message can arrive
// over the socket while the history request is still in flight) and keep
// oldest-first order.
function mergeMessages(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of a) byId.set(m.id, m);
  for (const m of b) byId.set(m.id, m);
  return [...byId.values()].sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime());
}

// Matches realtime.gateway.ts's real event contract exactly — 'join' with
// {context, contextId} to enter the room, 'chat:send' to post, 'chat:message'
// broadcast back to everyone in it (including the sender — a message
// reflects back and is appended once, so callers must NOT also append it
// locally). On mount it also loads the chat backlog
// (GET /live/:id/chat or /rooms/:id/chat), so someone joining mid-stream
// isn't looking at an empty chat.
//
// For LIVE sessions it additionally tracks the real like counter
// ('live:like') and public viewer count ('live:viewer_count'), seeded from
// GET /live/:id/summary. Both are null until the first value arrives.
export function useLiveChat(context: 'LIVE' | 'ROOM', contextId: string, options: UseLiveChatOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  // Latest callback, read at event time — so the socket effect doesn't
  // reconnect every time the caller passes a new inline function.
  const onModerationRef = useRef(options.onModeration);
  onModerationRef.current = options.onModeration;
  const onRoomThemeRef = useRef(options.onRoomTheme);
  onRoomThemeRef.current = options.onRoomTheme;
  const onPkEventRef = useRef(options.onPkEvent);
  onPkEventRef.current = options.onPkEvent;
  const onMediaRef = useRef(options.onMedia);
  onMediaRef.current = options.onMedia;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [giftEvents, setGiftEvents] = useState<GiftEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [viewerCount, setViewerCount] = useState<number | null>(null);

  const pendingLikes = useRef(0);
  const likeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!contextId) return;
    let cancelled = false;

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
      setMessages((prev) => mergeMessages(prev, [message]));
    });

    // Keeps only the last few — this is meant for a brief on-screen
    // announcement, not a growing list to scroll through.
    socket.on('gift:sent', (event: GiftEvent) => {
      setGiftEvents((prev) => [...prev.slice(-4), event]);
    });

    socket.on('live:media', (message: LiveMediaMessage) => onMediaRef.current?.(message));

    if (context === 'ROOM') {
      socket.on('room:moderation', (event: RoomModerationEvent) => {
        onModerationRef.current?.(event);
      });
      socket.on('room:theme', (event: { roomId: string; themeColor: string }) => {
        onRoomThemeRef.current?.(event);
      });
    }

    if (context === 'LIVE') {
      socket.on('live:moderation', (event: RoomModerationEvent) => {
        onModerationRef.current?.(event);
      });
      socket.on('pk:countdown_start', (e: PkLifecycleEvent) => onPkEventRef.current?.('pk:countdown_start', e));
      socket.on('pk:active', (e: PkLifecycleEvent) => onPkEventRef.current?.('pk:active', e));
      socket.on('pk:settled', (e: PkLifecycleEvent) => onPkEventRef.current?.('pk:settled', e));

      // Counters only ever ratchet forward for likes (a late/out-of-order
      // event can't make the number drop); viewer count legitimately goes
      // both ways, so it's taken as-is.
      socket.on('live:like', (e: { likeCount: number }) => {
        setLikeCount((prev) => Math.max(prev ?? 0, e.likeCount));
      });
      socket.on('live:viewer_count', (e: { viewerCount: number }) => {
        setViewerCount(e.viewerCount);
      });

      fetchLiveSummary(contextId)
        .then((s) => {
          if (cancelled) return;
          setLikeCount((prev) => Math.max(prev ?? 0, s.likeCount));
          setViewerCount((prev) => prev ?? s.viewerCount);
        })
        .catch(() => {
          /* header just shows 0 until the first socket event */
        });
    }

    // Backlog. Failure is non-fatal — live messages still flow.
    fetchChatHistory(context, contextId, { limit: 50 })
      .then((history) => {
        if (cancelled) return;
        setMessages((prev) => mergeMessages(history, prev));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      // Don't drop taps that were still waiting on the flush timer.
      if (likeTimer.current) clearTimeout(likeTimer.current);
      likeTimer.current = null;
      if (context === 'LIVE' && pendingLikes.current > 0) {
        likeLiveSession(contextId, pendingLikes.current).catch(() => {});
      }
      pendingLikes.current = 0;
      socket.emit('leave', { context, contextId });
      socket.disconnect();
      socketRef.current = null;
      setMessages([]);
      setLikeCount(null);
      setViewerCount(null);
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

  // Call once per tap. The UI should spawn its heart animation immediately;
  // the authoritative number comes back through 'live:like' after the flush.
  const sendLike = useCallback(() => {
    if (context !== 'LIVE' || !contextId) return;
    pendingLikes.current += 1;
    if (likeTimer.current) return;
    likeTimer.current = setTimeout(() => {
      const count = pendingLikes.current;
      pendingLikes.current = 0;
      likeTimer.current = null;
      if (count > 0) likeLiveSession(contextId, count).catch(() => {});
    }, LIKE_FLUSH_MS);
  }, [context, contextId]);

  return { messages, giftEvents, isConnected, sendMessage, likeCount, viewerCount, sendLike };
}
