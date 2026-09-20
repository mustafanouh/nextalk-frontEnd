import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/** Zustand persist hydrates from localStorage after first paint. */
export function useHasHydrated() {
  return useSyncExternalStore(
    (callback) => useAuthStore.persist.onFinishHydration(callback),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
}
