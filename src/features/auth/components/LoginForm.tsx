'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, LoginFormValues } from '../schemas';
import { useLogin } from '../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function LoginForm() {
  const [language] = useState<'ar' | 'en'>(() => (
    typeof window !== 'undefined' && localStorage.getItem('locale') === 'en' ? 'en' : 'ar'
  ));
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const login = useLogin();
  const isEnglish = language === 'en';

  return (
    <form
      onSubmit={handleSubmit((data) => login.mutate(data))}
      className="w-full max-w-md space-y-6 rounded-[2rem] border border-white/80 bg-white px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:px-8 sm:py-10 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none"
      dir={isEnglish ? 'ltr' : 'rtl'}
    >
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/20">
          N
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">NexTalk</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {isEnglish ? 'Welcome back' : 'مرحبًا بعودتك'}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {isEnglish ? 'Enter your details to sign in' : 'أدخل بياناتك لتسجيل الدخول'}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Email address or username' : 'البريد الإلكتروني أو اسم المستخدم'}</span>
          <Input
            placeholder={isEnglish ? 'you@example.com' : 'name@example.com'}
            error={errors.identifier?.message}
            {...register('identifier')}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Password' : 'كلمة المرور'}</span>
          <Input
            type="password"
            placeholder={isEnglish ? 'Enter your password' : 'أدخل كلمة المرور'}
            error={errors.password?.message}
            {...register('password')}
          />
        </label>
      </div>

      <div className="flex items-center justify-end">
        <Link href="/forgot-password" className="text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline">
          {isEnglish ? 'Forgot password?' : 'نسيت كلمة المرور؟'}
        </Link>
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl bg-slate-950 text-base shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500" isLoading={login.isPending}>
        {isEnglish ? 'Sign in' : 'تسجيل الدخول'}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {isEnglish ? "Don't have an account?" : 'ليس لديك حساب؟'}{' '}
        <Link href="/register" className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline">
          {isEnglish ? 'Create account' : 'إنشاء حساب'}
        </Link>
      </p>
    </form>
  );
}
