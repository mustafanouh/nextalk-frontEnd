import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import { ApiError } from '@/types/api';

export const TOKEN_STORAGE_KEY = 'nextalk_token';

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: 'application/json',
  },
});

// ── Request: attach Bearer token ────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response: normalize errors, handle global 401 ───────────────────
// A single event name is dispatched on 401 rather than importing the auth
// store here (which would create lib -> store -> api -> lib circularity).
// AppProvider listens for it and clears the session.
export const UNAUTHORIZED_EVENT = 'nextalk:unauthorized';

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    if (status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    const message = error.response?.data?.message ?? fallbackMessage(status);

    return Promise.reject({
      status,
      message,
      errors: error.response?.data?.errors,
    } satisfies ApiError & { status?: number });
  }
);

function fallbackMessage(status?: number): string {
  const isEnglish = typeof window !== 'undefined' && localStorage.getItem('locale') === 'en';

  switch (status) {
    case 403:
      return isEnglish ? 'You are not authorized to perform this action.' : 'ليس لديك صلاحية لتنفيذ هذا الإجراء.';
    case 404:
      return isEnglish ? 'The requested item was not found.' : 'العنصر المطلوب غير موجود.';
    case 422:
      return isEnglish ? 'The provided data is invalid.' : 'البيانات المدخلة غير صحيحة.';
    case 429:
      return isEnglish ? 'Too many attempts. Please try again later.' : 'محاولات كثيرة جدًا، حاول مرة أخرى بعد قليل.';
    case 500:
      return isEnglish ? 'A server error occurred. Please try again.' : 'حدث خطأ في الخادم، حاول مرة أخرى.';
    default:
      return isEnglish
        ? 'An unexpected error occurred. Please check your internet connection.'
        : 'حدث خطأ غير متوقع، تحقق من اتصالك بالإنترنت.';
  }
}
