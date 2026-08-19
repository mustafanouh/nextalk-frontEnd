import { api } from '@/lib/axios';
import { PublicUser, User } from '@/types/user';

export const usersApi = {
  me: () => api.get<User>('/users/me').then((r) => r.data),

  updateMe: (data: FormData | Record<string, unknown>) =>
    api
      .patch<User>('/users/me', data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      })
      .then((r) => r.data),

  search: (q: string) => api.get<PublicUser[]>('/users/search', { params: { q } }).then((r) => r.data),

  findByUsername: (username: string) => api.get<PublicUser>(`/users/${username}`).then((r) => r.data),
};
