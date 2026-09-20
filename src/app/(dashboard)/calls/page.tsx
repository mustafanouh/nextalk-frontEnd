'use client';

import { useConversations } from '@/features/conversations/hooks/useConversations';
import { useChatStore } from '@/stores/chat.store';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/States';
import { Phone, Video } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * NOTE: the backend spec doesn't expose a standalone "GET /calls" history
 * endpoint (calls are scoped per-conversation via POST .../calls only) —
 * this page lists conversations as call-capable contacts instead. Add a
 * dedicated `GET /api/calls` (call history across all conversations) on
 * the backend if you want a true chronological call log here.
 */
export default function CallsPage() {
  const { data, isLoading, isError, refetch } = useConversations();
  const setSelectedConversation = useChatStore((s) => s.setSelectedConversation);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const router = useRouter();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const conversations = data?.data ?? [];

  if (conversations.length === 0) {
    return <EmptyState title="لا توجد جهات اتصال بعد" description="ابدأ محادثة أولاً لتتمكن من الاتصال" />;
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold text-gray-900">المكالمات</h1>
      <div className="space-y-1">
        {conversations.map((conversation) => {
          const other = conversation.participants.find((p) => p.id !== currentUserId) ?? conversation.participants[0];
          return (
            <div key={conversation.id} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Avatar src={other?.avatar_thumb_url} name={other?.name ?? '?'} />
                <p className="text-sm font-medium text-gray-900">{other?.name}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSelectedConversation(conversation.id);
                    router.push(`/chat/${conversation.id}`);
                  }}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="اتصال صوتي"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedConversation(conversation.id);
                    router.push(`/chat/${conversation.id}`);
                  }}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="اتصال فيديو"
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
