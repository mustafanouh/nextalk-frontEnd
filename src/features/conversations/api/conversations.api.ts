import { api } from '@/lib/axios';
import { Conversation } from '@/types/conversation';
import { PaginatedResponse } from '@/types/api';

export const conversationsApi = {
  list: () => api.get<PaginatedResponse<Conversation>>('/conversations').then((r) => r.data),

  create: (userId: number) =>
    api.post<Conversation>('/conversations', { user_id: userId }).then((r) => r.data),

  show: (id: number) => api.get<Conversation>(`/conversations/${id}`).then((r) => r.data),
};
