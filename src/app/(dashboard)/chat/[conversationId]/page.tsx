'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ConversationList } from '@/features/conversations/components/ConversationList';
import { ConversationView } from '@/features/conversations/components/ConversationView';
import { useChatStore } from '@/stores/chat.store';
import { cn } from '@/lib/utils';

export default function ChatConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const { selectedConversationId, isMobileConversationOpen, setSelectedConversation } = useChatStore();

  useEffect(() => {
    const id = Number(params.conversationId);
    if (!Number.isNaN(id)) setSelectedConversation(id);
  }, [params.conversationId, setSelectedConversation]);

  return (
    <div className="flex h-full">
      <div className={cn('w-full shrink-0 md:block md:w-80', isMobileConversationOpen ? 'hidden' : 'block')}>
        <ConversationList />
      </div>
      <div className={cn('flex-1', !isMobileConversationOpen && 'hidden md:block')}>
        <ConversationView conversationId={selectedConversationId} />
      </div>
    </div>
  );
}
