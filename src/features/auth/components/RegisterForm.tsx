'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { registerSchema, RegisterFormValues } from '../schemas';
import { useRegister } from '../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function RegisterForm() {
  const [language] = useState<'ar' | 'en'>(() => (
    typeof window !== 'undefined' && localStorage.getItem('locale') === 'en' ? 'en' : 'ar'
  ));
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });
  const registerMutation = useRegister();
  const isEnglish = language === 'en';

  return (
    <form
      onSubmit={handleSubmit((data) => registerMutation.mutate({ ...data, phone: data.phone || undefined }))}
      className="w-full max-w-md space-y-6 rounded-[2rem] border border-white/80 bg-white px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:px-8 sm:py-10 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none"
      dir={isEnglish ? 'ltr' : 'rtl'}
    >
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/20">
          N
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">NexTalk</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {isEnglish ? 'Create your account' : 'أنشئ حسابك'}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {isEnglish ? 'Start chatting on NexTalk' : 'ابدأ محادثاتك على NexTalk'}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Username' : 'اسم المستخدم'}</span>
          <Input placeholder={isEnglish ? 'Choose a username' : 'اختر اسم مستخدم'} error={errors.username?.message} {...register('username')} />
        </label>
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Full name' : 'الاسم الكامل'}</span>
          <Input placeholder={isEnglish ? 'Your full name' : 'اكتب اسمك الكامل'} error={errors.name?.message} {...register('name')} />
        </label>
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Email address' : 'البريد الإلكتروني'}</span>
          <Input type="email" placeholder={isEnglish ? 'you@example.com' : 'name@example.com'} error={errors.email?.message} {...register('email')} />
        </label>
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Phone number (optional)' : 'رقم الهاتف (اختياري)'}</span>
          <Input placeholder={isEnglish ? 'Your phone number' : 'رقم هاتفك'} error={errors.phone?.message} {...register('phone')} />
        </label>
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Password' : 'كلمة المرور'}</span>
          <Input type="password" placeholder={isEnglish ? 'Create a password' : 'أنشئ كلمة مرور'} error={errors.password?.message} {...register('password')} />
        </label>
        <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>{isEnglish ? 'Confirm password' : 'تأكيد كلمة المرور'}</span>
          <Input
            type="password"
            placeholder={isEnglish ? 'Repeat your password' : 'أعد كتابة كلمة المرور'}
            error={errors.password_confirmation?.message}
            {...register('password_confirmation')}
          />
        </label>
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl bg-slate-950 text-base shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500" isLoading={registerMutation.isPending}>
        {isEnglish ? 'Create account' : 'إنشاء الحساب'}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {isEnglish ? 'Already have an account?' : 'لديك حساب بالفعل؟'}{' '}
        <Link href="/login" className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline">
          {isEnglish ? 'Sign in' : 'تسجيل الدخول'}
        </Link>
      </p>
    </form>
  );
}
