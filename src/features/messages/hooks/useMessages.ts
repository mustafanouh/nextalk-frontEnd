import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { messagesApi } from '../api/messages.api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/use-toast';
import { Message, MessageType } from '@/types/message';
import { PaginatedResponse } from '@/types/api';
import { ApiError } from '@/types/api';

/**
 * Cursor-style pagination on top of Laravel's page-based paginator: each
 * page is fetched newest-first (page 1 = latest 30 messages), and pages[0]
 * always holds the newest page so EchoProvider can prepend new messages to
 * it directly. "Load more" fetches the next page number, which is OLDER
 * messages, appended to the end of the `pages` array.
 */
export function useMessages(conversationId: number | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId ?? 0),
    queryFn: ({ pageParam }) => messagesApi.history(conversationId as number, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<Message>) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
    enabled: conversationId !== null,
    staleTime: 10 * 1000,
  });
}

interface SendTextInput {
  conversationId: number;
  body: string;
}

export function useSendMessage() {
  const currentUser = useAuthStore((s) => s.user);
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ conversationId, body }: SendTextInput) => messagesApi.sendText(conversationId, body),

    // Optimistic update: show the message immediately with status 'sending',
    // then reconcile with the real row (or mark 'failed') on settle.
    onMutate: async ({ conversationId, body }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(conversationId) });

      const optimisticId = -Date.now(); // negative = guaranteed not to collide with a real DB id
      const optimisticMessage: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: currentUser?.id ?? 0,
        type: 'text',
        body,
        attachments: [],
        created_at: new Date().toISOString(),
        status: 'sending',
        sender: currentUser
          ? { id: currentUser.id, username: currentUser.username, name: currentUser.name, avatar: currentUser.avatar }
          : undefined,
      };

      queryClient.setQueryData<{ pages: PaginatedResponse<Message>[]; pageParams: unknown[] }>(
        queryKeys.messages(conversationId),
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return { ...old, pages: [{ ...firstPage, data: [optimisticMessage, ...firstPage.data] }, ...rest] };
        }
      );

      return { optimisticId, conversationId };
    },

    onSuccess: (message, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData<{ pages: PaginatedResponse<Message>[]; pageParams: unknown[] }>(
        queryKeys.messages(context.conversationId),
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              { ...firstPage, data: firstPage.data.map((m) => (m.id === context.optimisticId ? message : m)) },
              ...rest,
            ],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },

    onError: (error: ApiError, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData<{ pages: PaginatedResponse<Message>[]; pageParams: unknown[] }>(
        queryKeys.messages(context.conversationId),
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                data: firstPage.data.map((m) =>
                  m.id === context.optimisticId ? { ...m, status: 'failed' as const } : m
                ),
              },
              ...rest,
            ],
          };
        }
      );
      toast({ title: 'فشل إرسال الرسالة', description: error.message, variant: 'destructive' });
    },
  });
}

interface SendAttachmentInput {
  conversationId: number;
  type: Extract<MessageType, 'image' | 'file'>;
  file: File;
  caption?: string;
  onProgress?: (percent: number) => void;
}

export function useSendAttachment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ conversationId, type, file, caption, onProgress }: SendAttachmentInput) =>
      messagesApi.sendAttachment(conversationId, type, file, caption, onProgress),
    onSuccess: (_message, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
    onError: (error: ApiError) => {
      toast({ title: 'فشل رفع المرفق', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMessage(conversationId: number) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (messageId: number) => messagesApi.delete(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(conversationId) });
      queryClient.setQueryData<{ pages: PaginatedResponse<Message>[]; pageParams: unknown[] }>(
        queryKeys.messages(conversationId),
        (old) => {
          if (!old) return old;
          return { ...old, pages: old.pages.map((p) => ({ ...p, data: p.data.filter((m) => m.id !== messageId) })) };
        }
      );
    },
    onError: (error: ApiError) => {
      toast({ title: 'فشل حذف الرسالة', description: error.message, variant: 'destructive' });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
    },
  });
}
