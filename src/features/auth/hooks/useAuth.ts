import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { disconnectEcho } from '@/lib/echo';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/types/api';
import { LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload } from '@/types/auth';

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.user,
    queryFn: authApi.me,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setSession(data.user, data.token);
      queryClient.setQueryData(queryKeys.user, data.user);
      router.push('/chat');
    },
    onError: (error: ApiError) => {
      toast({ title: 'فشل تسجيل الدخول', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setSession(data.user, data.token);
      queryClient.setQueryData(queryKeys.user, data.user);
      router.push('/chat');
    },
    onError: (error: ApiError) => {
      toast({ title: 'فشل إنشاء الحساب', description: error.message, variant: 'destructive' });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Clear locally regardless of whether the server call succeeded —
      // an expired token should still let the user log out client-side.
      clearSession();
      disconnectEcho();
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function useForgotPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
    onSuccess: (data) => toast({ title: 'تم الإرسال', description: data.message, variant: 'success' }),
    onError: (error: ApiError) => toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' }),
  });
}

export function useResetPassword() {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: (data) => {
      toast({ title: 'تم', description: data.message, variant: 'success' });
      router.push('/login');
    },
    onError: (error: ApiError) => toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' }),
  });
}
