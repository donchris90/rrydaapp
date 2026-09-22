import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config';
import { getAccessToken } from '../api/client';
import type { PkStatus } from '../api/pk';

export interface PkScoreEvent {
  pkBattleId: string;
  scoreChallenger: string;
  scoreOpponent: string;
}

// Payload of pk:countdown_start / pk:active / pk:settled — a full snapshot
// of the battle at that moment, so a handler can patch its cache directly.
export interface PkLifecycleEvent {
  pkBattleId: string;
  challengerId: string;
  opponentId: string;
  status: PkStatus;
  scoreChallenger: string;
  scoreOpponent: string;
  startedAt: string | null;
  endsAt: string | null;
  winnerId: string | null;
  settledAt: string | null;
  // Server clock at send time — compare with Date.now() to correct for
  // device clock skew when counting down to startedAt / endsAt.
  serverTime: string;
}

export interface PkLifecycleHandlers {
  onCountdownStart?: (event: PkLifecycleEvent) => void;
  onActive?: (event: PkLifecycleEvent) => void;
  onSettled?: (event: PkLifecycleEvent) => void;
}

// One socket for as long as the caller is mounted (not only while a battle
// is being tracked): the backend pushes pk:countdown_start / pk:active /
// pk:settled to each participant's personal room, so a challenger who is
// still waiting for the accept — and therefore has no battle channel to
// join yet — still hears about it. The pk:{battleId} channel is joined on
// top of that whenever `battleId` is set, which is what carries pk:score.
//
// Uses the gateway's generic 'join'/'leave' with context 'pk' (lowercase),
// which just builds the room name string — no backend enum involved.
//
// The 3s/15s poll in PkPanel stays as a slower fallback for a socket that
// drops silently mid-battle; these events are the primary path.
export function usePkScoreSocket(
  battleId: string | null,
  onScore: (event: PkScoreEvent) => void,
  handlers: PkLifecycleHandlers = {},
) {
  const socketRef = useRef<Socket | null>(null);

  // Latest callbacks / battle id, read at event time so the socket effect
  // never has to reconnect when the caller passes fresh inline functions.
  const battleIdRef = useRef(battleId);
  battleIdRef.current = battleId;
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = getAccessToken();
    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Also runs on every reconnect, re-entering the battle channel.
      if (battleIdRef.current) socket.emit('join', { context: 'pk', contextId: battleIdRef.current });
    });

    socket.on('pk:score', (event: PkScoreEvent) => {
      if (event.pkBattleId === battleIdRef.current) onScoreRef.current(event);
    });

    socket.on('pk:countdown_start', (event: PkLifecycleEvent) => handlersRef.current.onCountdownStart?.(event));
    socket.on('pk:active', (event: PkLifecycleEvent) => handlersRef.current.onActive?.(event));
    socket.on('pk:settled', (event: PkLifecycleEvent) => handlersRef.current.onSettled?.(event));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Battle channel follows battleId. On first mount the socket isn't
  // connected yet — the 'connect' handler above does the join then.
  useEffect(() => {
    const socket = socketRef.current;
    if (!battleId || !socket) return;
    if (socket.connected) socket.emit('join', { context: 'pk', contextId: battleId });
    return () => {
      socket.emit('leave', { context: 'pk', contextId: battleId });
    };
  }, [battleId]);
}
