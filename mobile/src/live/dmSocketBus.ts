import type { Socket } from 'socket.io-client';

// A tiny bridge so screens can send and receive typing indicators over the
// one app-wide socket that useDirectMessagePush owns, instead of each
// opening its own connection. That hook registers the socket here on
// connect and forwards incoming 'dm:typing' events to listeners.

export interface TypingEvent {
  fromUserId: string;
  typing: boolean;
}

let socket: Socket | null = null;
const listeners = new Set<(event: TypingEvent) => void>();

export function setDmSocket(next: Socket | null) {
  socket = next;
}

// Silently a no-op while offline — typing indicators are best-effort.
export function emitTyping(toUserId: string, typing: boolean) {
  socket?.emit('dm:typing', { toUserId, typing });
}

export function onTyping(listener: (event: TypingEvent) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function dispatchTyping(event: TypingEvent) {
  listeners.forEach((listener) => listener(event));
}
