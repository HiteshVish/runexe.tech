import type { SessionSnapshot } from "./types";

const MAX_HISTORY = 80;

export type HistoryState = {
  past: SessionSnapshot[];
  future: SessionSnapshot[];
  /** Coalesce key for continuous drag/typing */
  coalesceKey: string | null;
};

export function emptyHistory(): HistoryState {
  return { past: [], future: [], coalesceKey: null };
}

export function pushHistory(
  hist: HistoryState,
  snapshot: SessionSnapshot,
  coalesceKey?: string | null,
): HistoryState {
  if (coalesceKey && hist.coalesceKey === coalesceKey && hist.past.length) {
    return { ...hist, future: [], coalesceKey };
  }
  const past = [...hist.past, snapshot];
  while (past.length > MAX_HISTORY) past.shift();
  return { past, future: [], coalesceKey: coalesceKey ?? null };
}

export function undoHistory(
  hist: HistoryState,
  current: SessionSnapshot,
): { hist: HistoryState; snapshot: SessionSnapshot } | null {
  if (!hist.past.length) return null;
  const past = [...hist.past];
  const snapshot = past.pop()!;
  return {
    hist: { past, future: [current, ...hist.future], coalesceKey: null },
    snapshot,
  };
}

export function redoHistory(
  hist: HistoryState,
  current: SessionSnapshot,
): { hist: HistoryState; snapshot: SessionSnapshot } | null {
  if (!hist.future.length) return null;
  const [snapshot, ...future] = hist.future;
  return {
    hist: { past: [...hist.past, current], future, coalesceKey: null },
    snapshot,
  };
}