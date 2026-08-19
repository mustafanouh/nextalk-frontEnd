'use client';

import { ReactNode, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { LoadingState } from '@/components/shared/States';

// Zustand's persist middleware hydrates asynchronously from localStorage;
// without this guard we'd redirect logged-in users to /login for a frame
// on every hard refresh, before hydration finishes. useSyncExternalStore
// (rather than an effect + setState) keeps this a pure subscription.
function useHasHydrated() {
  return useSyncExternalStore(
    (callback) => useAuthStore.persist.onFinishHydration(callback),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return <LoadingState label="جاري التحقق من الجلسة..." />;
  }

  return <>{children}</>;
}
