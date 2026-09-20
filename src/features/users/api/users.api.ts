import { api } from '@/lib/axios';
import { PublicUser, User } from '@/types/user';

export const usersApi = {
  me: () => api.get<User>('/users/me').then((r) => r.data),

  updateMe: (data: FormData | Record<string, unknown>) => {
    // Two things were broken here before:
    // 1. Manually setting Content-Type on a FormData body strips the
    //    boundary the browser would otherwise generate automatically —
    //    the server can't parse a multipart body without it. Never set
    //    this header yourself for FormData; let axios/the browser do it.
    // 2. PHP never populates $_FILES (and thus Laravel's $request->hasFile())
    //    for PUT/PATCH requests — only POST parses multipart bodies that
    //    way. Laravel's standard fix is method-spoofing: send a real POST
    //    with a `_method=PATCH` field, which Laravel's routing treats as
    //    a PATCH while PHP still parses the body correctly as a POST.
    if (data instanceof FormData) {
      data.append('_method', 'PATCH');
      return api.post<User>('/users/me', data).then((r) => r.data);
    }
    return api.patch<User>('/users/me', data).then((r) => r.data);
  },

  search: (q: string) => api.get<PublicUser[]>('/users/search', { params: { q } }).then((r) => r.data),

  findByUsername: (username: string) => api.get<PublicUser>(`/users/${username}`).then((r) => r.data),
};
