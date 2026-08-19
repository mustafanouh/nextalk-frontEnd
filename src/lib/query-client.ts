import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Centralized, organized query keys (plan section 7) ──────────────
export const queryKeys = {
  user: ['user'] as const,
  users: {
    search: (q: string) => ['users', 'search', q] as const,
    byUsername: (username: string) => ['users', username] as const,
  },
  conversations: ['conversations'] as const,
  conversation: (id: number) => ['conversation', id] as const,
  messages: (conversationId: number) => ['messages', conversationId] as const,
  calls: ['calls'] as const,
};
