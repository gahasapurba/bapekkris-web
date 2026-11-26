// One-shot "open this item" hand-off between site search and the page it navigates to
// (e.g. a Bible chapter, a hymn, a devotion). The target page consumes the intent on mount, or
// immediately when it is already open.

import { useEffect, useRef } from 'react';

export interface PageIntents {
  alkitab: { bookId: string; chapter: number };
  lagu: { songId: string };
  renungan: { devotionId: string };
  easyworship: { scheduleId: string };
}
type IntentTab = keyof PageIntents;

const pending: Partial<{ [K in IntentTab]: PageIntents[K] }> = {};
const listeners = new Set<() => void>();

export function setPageIntent<K extends IntentTab>(tab: K, payload: PageIntents[K]): void {
  pending[tab] = payload;
  listeners.forEach((listener) => listener());
}

/** Calls `apply` with the pending intent for `tab`, once, now or when one arrives later. */
export function usePageIntent<K extends IntentTab>(tab: K, apply: (payload: PageIntents[K]) => void): void {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    const consume = () => {
      const payload = pending[tab];
      if (!payload) return;
      delete pending[tab];
      applyRef.current(payload as PageIntents[K]);
    };
    consume();
    listeners.add(consume);
    return () => { listeners.delete(consume); };
  }, [tab]);
}
