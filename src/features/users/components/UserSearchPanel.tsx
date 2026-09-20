'use client';

import { useUserSearch } from '../hooks/useUsers';
import { useCreateConversation } from '@/features/conversations/hooks/useConversations';
import { Avatar } from '@/components/ui/avatar';
import { LoadingState, EmptyState } from '@/components/shared/States';

interface UserSearchPanelProps {
  query: string;
  onSelected: () => void;
}

export function UserSearchPanel({ query, onSelected }: UserSearchPanelProps) {
  const { data: users, isLoading } = useUserSearch(query);
  const createConversation = useCreateConversation();

  if (isLoading) return <LoadingState label="جاري البحث..." />;

  if (!users || users.length === 0) {
    return <EmptyState title="لا يوجد مستخدمين بهذا الاسم" />;
  }

  return (
    <div className="flex-1 space-y-1 overflow-y-auto p-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => {
            createConversation.mutate(user.id);
            onSelected();
          }}
          className="flex w-full items-center gap-3 rounded-lg p-2.5 text-right hover:bg-gray-100"
        >
          <Avatar src={user.avatar_thumb_url} name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">@{user.username}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
