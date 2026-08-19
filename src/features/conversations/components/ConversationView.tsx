'use client';

import { useConversation } from '../hooks/useConversations';
import { ConversationHeader } from './ConversationHeader';
import { MessageList } from '@/features/messages/components/MessageList';
import { MessageComposer } from '@/features/messages/components/MessageComposer';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/States';
import { MessageSquare } from 'lucide-react';

export function ConversationView({ conversationId }: { conversationId: number | null }) {
  const { data: conversation, isLoading, isError, refetch } = useConversation(conversationId);

  if (conversationId === null) {
    return (
      <EmptyState
        title="اختر محادثة"
        description="اختر محادثة من القائمة أو ابحث عن مستخدم لبدء محادثة جديدة"
        icon={<MessageSquare className="h-8 w-8" />}
      />
    );
  }

  if (isLoading) return <LoadingState label="جاري تحميل المحادثة..." />;
  if (isError || !conversation) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader conversation={conversation} />
      <MessageList conversationId={conversation.id} />
      <MessageComposer conversationId={conversation.id} />
    </div>
  );
}
