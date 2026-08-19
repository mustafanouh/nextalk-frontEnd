import { User } from './user';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  identifier: string; // username or email
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}
