'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useCallInternal } from '../hooks/useCallInternal';

type CallContextValue = ReturnType<typeof useCallInternal>;

const CallContext = createContext<CallContextValue | null>(null);

/**
 * Mount ONCE, at the dashboard layout level. This is what fixes the
 * duplicate-subscription problem: useCallInternal() (which joins the
 * presence channel `call.{id}` and registers all signaling listeners) runs
 * a single time here; every consumer below reads the same instance via
 * useCall(), instead of each calling the hook itself and creating its own
 * parallel Echo subscription (which would double-handle offers/answers).
 */
export function CallProvider({ children }: { children: ReactNode }) {
  const call = useCallInternal();
  return <CallContext.Provider value={call}>{children}</CallContext.Provider>;
}

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCall must be used within <CallProvider>. Check that (dashboard)/layout.tsx wraps its children with it.');
  }
  return ctx;
}
