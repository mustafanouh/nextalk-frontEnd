import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/types/api';

/** Debounces the raw input so we don't fire a request on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function useUserSearch(query: string) {
  const debounced = useDebouncedValue(query);

  return useQuery({
    queryKey: queryKeys.users.search(debounced),
    queryFn: () => usersApi.search(debounced),
    enabled: debounced.trim().length >= 2,
  });
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) => usersApi.updateMe(data),
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(queryKeys.user, user);
      toast({ title: 'تم تحديث الملف الشخصي', variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({ title: 'فشل التحديث', description: error.message, variant: 'destructive' });
    },
  });
}
