'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCallStore } from '@/stores/call.store';
import { getEcho, disconnectEcho } from '@/lib/echo';
import { queryClient, queryKeys } from '@/lib/query-client';
import { Message } from '@/types/message';
import { PaginatedResponse } from '@/types/api';
import { Call } from '@/features/calls/types';

export function EchoProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectEcho();
      return;
    }

    const echo = getEcho();
    const channel = echo.private(`user.${user.id}`);

    // ── Messages: patch cache directly, never full refetch (plan section 11) ──
    channel.listen('.MessageSent', ({ message }: { message: Message }) => {
      queryClient.setQueryData<{ pages: PaginatedResponse<Message>[]; pageParams: unknown[] }>(
        queryKeys.messages(message.conversation_id),
        (old) => {
          if (!old) return old;
          // Newest page is index 0 (see useMessages' getNextPageParam direction)
          const [firstPage, ...rest] = old.pages;
          const alreadyExists = firstPage.data.some((m) => m.id === message.id);
          if (alreadyExists) return old;

          return {
            ...old,
            pages: [{ ...firstPage, data: [message, ...firstPage.data] }, ...rest],
          };
        }
      );

      // Bump the conversation list so the sidebar reorders + shows the preview.
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    });

    channel.listen('.MessageDeleted', ({ message_id, conversation_id }: { message_id: number; conversation_id: number }) => {
      queryClient.setQueryData<{ pages: PaginatedResponse<Message>[]; pageParams: unknown[] }>(
        queryKeys.messages(conversation_id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((m) => m.id !== message_id),
            })),
          };
        }
      );
    });

    // ── Calls: only IncomingCall lives on the private channel. Once a call
    // exists, its lifecycle (Accepted/Rejected/Ended) and WebRTC signaling
    // move to the presence channel `call.{callId}`, handled by useWebRTC. ──
    channel.listen('.IncomingCall', ({ call }: { call: Call }) => {
      setIncomingCall(call);
      queryClient.invalidateQueries({ queryKey: queryKeys.calls });
    });

    return () => {
      echo.leave(`user.${user.id}`);
    };
  }, [isAuthenticated, user, setIncomingCall]);

  return <>{children}</>;
}
