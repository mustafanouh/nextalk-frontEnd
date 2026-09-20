'use client';

import { ArrowRight } from 'lucide-react';
import { Conversation } from '@/types/conversation';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { CallButtons } from '@/features/calls/components/CallButtons';

export function ConversationHeader({ conversation }: { conversation: Conversation }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const closeMobileConversation = useChatStore((s) => s.closeMobileConversation);
  const other = conversation.participants.find((p) => p.id !== currentUserId) ?? conversation.participants[0];

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <button onClick={closeMobileConversation} className="text-gray-500 md:hidden" aria-label="رجوع">
          <ArrowRight className="h-5 w-5" />
        </button>
        <Avatar src={other?.avatar_thumb_url} name={other?.name ?? '?'} />
        <div>
          <p className="text-sm font-semibold text-gray-900">{other?.name}</p>
          <p className="text-xs text-gray-400">@{other?.username}</p>
        </div>
      </div>
      <CallButtons conversationId={conversation.id} />
    </div>
  );
}
