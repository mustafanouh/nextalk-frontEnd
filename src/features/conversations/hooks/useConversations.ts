import { useMutation, useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useChatStore } from '@/stores/chat.store';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/types/api';

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: conversationsApi.list,
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: queryKeys.conversation(id ?? 0),
    queryFn: () => conversationsApi.show(id as number),
    enabled: id !== null,
  });
}

/**
 * Starts (or resumes) a private conversation with another user and selects
 * it in the UI. The backend itself de-duplicates private conversations
 * (ConversationService::findOrCreatePrivate), so this is safe to call
 * repeatedly for the same user.
 */
export function useCreateConversation() {
  const setSelectedConversation = useChatStore((s) => s.setSelectedConversation);
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: number) => conversationsApi.create(userId),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      queryClient.setQueryData(queryKeys.conversation(conversation.id), conversation);
      setSelectedConversation(conversation.id);
    },
    onError: (error: ApiError) => {
      toast({ title: 'تعذر بدء المحادثة', description: error.message, variant: 'destructive' });
    },
  });
}
