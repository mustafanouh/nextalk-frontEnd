'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, LoginFormValues } from '../schemas';
import { useLogin } from '../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const login = useLogin();

  return (
    <form onSubmit={handleSubmit((data) => login.mutate(data))} className="w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-gray-500">أهلاً بيك في NexTalk</p>
      </div>

      <Input
        placeholder="اسم المستخدم أو البريد الإلكتروني"
        error={errors.identifier?.message}
        {...register('identifier')}
      />
      <Input
        type="password"
        placeholder="كلمة المرور"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </div>

      <Button type="submit" className="w-full" isLoading={login.isPending}>
        دخول
      </Button>

      <p className="text-center text-sm text-gray-500">
        مالكش حساب؟{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}
