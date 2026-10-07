'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QueryProvider } from './QueryProvider';
import { EchoProvider } from './EchoProvider';
import { useAuthStore } from '@/stores/auth.store';
import { UNAUTHORIZED_EVENT } from '@/lib/axios';
import { Toaster } from '@/components/ui/toaster';

function GlobalAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    function handleUnauthorized() {
      clearSession();
      router.replace('/login');
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSession, router]);

  return <>{children}</>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <EchoProvider>
        <GlobalAuthGuard>{children}</GlobalAuthGuard>
    
        <Toaster />
      </EchoProvider>
    </QueryProvider>
  );
}
