import { api } from '@/lib/axios';
import { Message, MessageType } from '@/types/message';
import { PaginatedResponse } from '@/types/api';

export const messagesApi = {
  history: (conversationId: number, page = 1, perPage = 30) =>
    api
      .get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages`, {
        params: { page, per_page: perPage },
      })
      .then((r) => r.data),

  sendText: (conversationId: number, body: string) =>
    api
      .post<Message>(`/conversations/${conversationId}/messages`, { type: 'text', body })
      .then((r) => r.data),

  sendAttachment: (
    conversationId: number,
    type: Extract<MessageType, 'image' | 'file'>,
    file: File,
    caption?: string,
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('attachment', file);
    if (caption) formData.append('body', caption);

    return api
      .post<Message>(`/conversations/${conversationId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },

  delete: (messageId: number) => api.delete(`/messages/${messageId}`).then((r) => r.data),
};
