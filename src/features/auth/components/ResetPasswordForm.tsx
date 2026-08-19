'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { resetPasswordSchema, ResetPasswordFormValues } from '../schemas';
import { useResetPassword } from '../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, email },
  });
  const resetPassword = useResetPassword();

  return (
    <form onSubmit={handleSubmit((data) => resetPassword.mutate(data))} className="w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تعيين كلمة مرور جديدة</h1>
      </div>

      <input type="hidden" {...register('token')} />
      <Input type="email" placeholder="البريد الإلكتروني" error={errors.email?.message} {...register('email')} />
      <Input
        type="password"
        placeholder="كلمة المرور الجديدة"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        type="password"
        placeholder="تأكيد كلمة المرور"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />

      <Button type="submit" className="w-full" isLoading={resetPassword.isPending}>
        تعيين كلمة المرور
      </Button>
    </form>
  );
}
