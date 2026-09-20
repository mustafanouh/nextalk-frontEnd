'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useHasHydrated } from '@/features/auth/hooks/useHasHydrated';
import { useCallStore } from '@/stores/call.store';
import { getEcho, disconnectEcho } from '@/lib/echo';
import { queryClient, queryKeys } from '@/lib/query-client';
import { Message } from '@/types/message';
import { PaginatedResponse } from '@/types/api';
import { parseIncomingCallPayload } from '@/features/calls/types';

export function EchoProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const hasHydrated = useHasHydrated();

  const setIncomingCall = useCallStore((s) => s.setIncomingCall);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || !userId) {
      console.log('[Echo] Not authenticated - disconnecting');

      disconnectEcho();
      return;
    }

    const echo = getEcho();
    const channelName = `user.${userId}`;

    console.log('[Echo] Subscribing to:', channelName);

    const channel = echo.private(channelName);

    /*
     * ------------------------------------------------------------
     * Echo / Reverb connection diagnostics
     * ------------------------------------------------------------
     */

    const connector = echo.connector as {
      pusher?: {
        connection?: {
          bind?: (event: string, callback: (...args: unknown[]) => void) => void;
        };
      };
    };

    connector.pusher?.connection?.bind?.('connected', () => {
      console.log('[Echo] Reverb connected');
    });

    connector.pusher?.connection?.bind?.('connecting', () => {
      console.log('[Echo] Reverb connecting');
    });

    connector.pusher?.connection?.bind?.('disconnected', () => {
      console.warn('[Echo] Reverb disconnected');
    });

    connector.pusher?.connection?.bind?.('error', (error) => {
      console.error('[Echo] Reverb connection error:', error);
    });

    /*
     * ------------------------------------------------------------
     * Private channel subscription diagnostics
     * ------------------------------------------------------------
     */

    const privateChannel = channel as typeof channel & {
      subscribed?: (callback: () => void) => void;
      error?: (callback: (error: unknown) => void) => void;
    };

    privateChannel.subscribed?.(() => {
      console.log('[Echo] Successfully subscribed to:', channelName);
    });

    privateChannel.error?.((error) => {
      console.error(
        '[Echo] Failed to subscribe to:',
        channelName,
        error
      );
    });

    /*
     * ------------------------------------------------------------
     * Messages
     * ------------------------------------------------------------
     */

    channel.listen(
      '.MessageSent',
      ({ message }: { message: Message }) => {
        console.log('[Echo] MessageSent received:', message);

        queryClient.setQueryData<
          {
            pages: PaginatedResponse<Message>[];
            pageParams: unknown[];
          }
        >(
          queryKeys.messages(message.conversation_id),
          (old) => {
            if (!old) {
              return old;
            }

            const [firstPage, ...rest] = old.pages;

            const alreadyExists = firstPage.data.some(
              (m) => m.id === message.id
            );

            if (alreadyExists) {
              return old;
            }

            return {
              ...old,
              pages: [
                {
                  ...firstPage,
                  data: [message, ...firstPage.data],
                },
                ...rest,
              ],
            };
          }
        );

        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations,
        });
      }
    );

    /*
     * ------------------------------------------------------------
     * Message deleted
     * ------------------------------------------------------------
     */

    channel.listen(
      '.MessageDeleted',
      ({
        message_id,
        conversation_id,
      }: {
        message_id: number;
        conversation_id: number;
      }) => {
        console.log('[Echo] MessageDeleted received:', {
          message_id,
          conversation_id,
        });

        queryClient.setQueryData<
          {
            pages: PaginatedResponse<Message>[];
            pageParams: unknown[];
          }
        >(
          queryKeys.messages(conversation_id),
          (old) => {
            if (!old) {
              return old;
            }

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.filter(
                  (m) => m.id !== message_id
                ),
              })),
            };
          }
        );
      }
    );

    /*
     * ------------------------------------------------------------
     * Incoming call
     * ------------------------------------------------------------
     */

    const onIncomingCall = (payload: unknown) => {
      console.log(
        '[Echo] IncomingCall received on',
        channelName,
        payload
      );

      const call = parseIncomingCallPayload(payload);

      if (!call) {
        console.error(
          '[Echo] IncomingCall payload could not be parsed:',
          payload
        );

        return;
      }

      console.log(
        '[Echo] Parsed incoming call:',
        call
      );

      setIncomingCall(call);

      queryClient.invalidateQueries({
        queryKey: queryKeys.calls,
      });
    };

    /*
     * Laravel:
     *
     * broadcastAs('IncomingCall')
     *
     * -> .IncomingCall
     *
     * Without broadcastAs:
     *
     * -> IncomingCall / namespaced event
     *
     * We keep both during diagnosis.
     */

    channel.listen(
      '.IncomingCall',
      onIncomingCall
    );

    channel.listen(
      'IncomingCall',
      onIncomingCall
    );

    /*
     * ------------------------------------------------------------
     * Cleanup
     * ------------------------------------------------------------
     */

    return () => {
      console.log(
        '[Echo] Leaving channel:',
        channelName
      );

      echo.leave(channelName);
    };
  }, [
    hasHydrated,
    isAuthenticated,
    userId,
    setIncomingCall,
  ]);

  return <>{children}</>;
}