'use client';

import { Conversation } from '@/types/conversation';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const other = conversation.participants.find((p) => p.id !== currentUserId) ?? conversation.participants[0];
  const lastMessage = conversation.latest_message;

  const preview = lastMessage
    ? lastMessage.type === 'text'
      ? lastMessage.body
      : lastMessage.type === 'image'
        ? '📷 صورة'
        : '📎 ملف'
    : 'ابدأ المحادثة';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg p-2.5 text-right transition-colors hover:bg-gray-100',
        isActive && 'bg-indigo-50 hover:bg-indigo-50'
      )}
    >
      <Avatar src={other?.avatar_thumb_url} name={other?.name ?? '?'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-gray-900">{other?.name}</p>
          {lastMessage && (
            <span className="shrink-0 text-[11px] text-gray-400">
              {formatDistanceToNow(new Date(lastMessage.created_at), { locale: ar, addSuffix: false })}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-500">{preview}</p>
      </div>
    </button>
  );
}
