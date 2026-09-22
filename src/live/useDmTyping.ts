import { useCallback, useEffect, useRef, useState } from 'react';
import { emitTyping, onTyping } from './dmSocketBus';

const RESEND_MS = 2500; // how often "still typing" is re-sent while the user keeps typing
const IDLE_MS = 3000; // stop signalling after this long without a keystroke
const REMOTE_EXPIRY_MS = 5000; // hide the other person's indicator if no update arrives

// Typing indicators for one direct-message conversation.
//   isOtherTyping — show "typing…" for the other person
//   notifyTyping(hasText) — call from the input's onChangeText
//   stopTyping() — call when a message is sent
//
// The remote side expires on its own, so a "typing: false" lost to a dropped
// connection can never leave the indicator stuck on.
export function useDmTyping(otherUserId: string) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    const off = onTyping((event) => {
      if (event.fromUserId !== otherUserId) return;
      if (remoteTimer.current) clearTimeout(remoteTimer.current);
      setIsOtherTyping(event.typing);
      if (event.typing) {
        remoteTimer.current = setTimeout(() => setIsOtherTyping(false), REMOTE_EXPIRY_MS);
      }
    });
    return () => {
      off();
      if (remoteTimer.current) clearTimeout(remoteTimer.current);
    };
  }, [otherUserId]);

  const stopTyping = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    if (lastSentAt.current !== 0) {
      lastSentAt.current = 0;
      emitTyping(otherUserId, false);
    }
  }, [otherUserId]);

  const notifyTyping = useCallback(
    (hasText: boolean) => {
      if (!hasText) {
        stopTyping();
        return;
      }
      const now = Date.now();
      if (now - lastSentAt.current > RESEND_MS) {
        lastSentAt.current = now;
        emitTyping(otherUserId, true);
      }
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(stopTyping, IDLE_MS);
    },
    [otherUserId, stopTyping],
  );

  // Leaving the screen ends the indicator.
  useEffect(() => stopTyping, [stopTyping]);

  return { isOtherTyping, notifyTyping, stopTyping };
}

