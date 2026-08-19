'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useConversations } from '../hooks/useConversations';
import { ConversationItem } from './ConversationItem';
import { useChatStore } from '@/stores/chat.store';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/States';
import { Input } from '@/components/ui/input';
import { UserSearchPanel } from '@/features/users/components/UserSearchPanel';

export function ConversationList() {
  const { data, isLoading, isError, refetch } = useConversations();
  const { selectedConversationId, setSelectedConversation } = useChatStore();
  const [search, setSearch] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  const conversations = data?.data ?? [];
  const filtered = search
    ? conversations.filter((c) =>
        c.participants.some((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      )
    : conversations;

  return (
    <div className="flex h-full flex-col border-l border-gray-200">
      <div className="border-b border-gray-200 p-3">
        <h2 className="mb-3 text-lg font-bold text-gray-900">المحادثات</h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="بحث في المحادثات أو مستخدمين جدد..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowUserSearch(e.target.value.length >= 2);
            }}
            className="pr-9"
          />
        </div>
      </div>

      {showUserSearch ? (
        <UserSearchPanel query={search} onSelected={() => { setSearch(''); setShowUserSearch(false); }} />
      ) : isLoading ? (
        <LoadingState label="جاري تحميل المحادثات..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد محادثات بعد" description="ابحث عن مستخدم لبدء محادثة جديدة" />
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {filtered.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === selectedConversationId}
              onClick={() => setSelectedConversation(conversation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
