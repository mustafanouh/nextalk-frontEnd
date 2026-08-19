import { api } from '@/lib/axios';
import {
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth';
import { User } from '@/types/user';

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<{ message: string }>('/auth/reset-password', payload).then((r) => r.data),
};
