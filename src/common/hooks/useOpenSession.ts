import { useState } from "react";

/**
 * Returns a number that increments each time `open` becomes true.
 * Use it as a `key` so a dialog's form remounts (and re-reads its initial
 * state from props) on every open, without resetting state in an effect.
 */
export function useOpenSession(open: boolean): number {
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((s) => s + 1);
  }

  return session;
}
