'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { registerSchema, RegisterFormValues } from '../schemas';
import { useRegister } from '../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });
  const registerMutation = useRegister();

  return (
    <form
      onSubmit={handleSubmit((data) => registerMutation.mutate({ ...data, phone: data.phone || undefined }))}
      className="w-full max-w-sm space-y-4"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
        <p className="mt-1 text-sm text-gray-500">ابدأ المحادثة على NexTalk</p>
      </div>

      <Input placeholder="اسم المستخدم" error={errors.username?.message} {...register('username')} />
      <Input placeholder="الاسم الكامل" error={errors.name?.message} {...register('name')} />
      <Input type="email" placeholder="البريد الإلكتروني" error={errors.email?.message} {...register('email')} />
      <Input placeholder="رقم الهاتف (اختياري)" error={errors.phone?.message} {...register('phone')} />
      <Input type="password" placeholder="كلمة المرور" error={errors.password?.message} {...register('password')} />
      <Input
        type="password"
        placeholder="تأكيد كلمة المرور"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />

      <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
        إنشاء الحساب
      </Button>

      <p className="text-center text-sm text-gray-500">
        عندك حساب بالفعل؟{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
