'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { forgotPasswordSchema, ForgotPasswordFormValues } from '../schemas';
import { useForgotPassword } from '../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const forgotPassword = useForgotPassword();

  return (
    <form onSubmit={handleSubmit((data) => forgotPassword.mutate(data))} className="w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">استعادة كلمة المرور</h1>
        <p className="mt-1 text-sm text-gray-500">هنبعتلك رابط إعادة تعيين على بريدك الإلكتروني</p>
      </div>

      <Input type="email" placeholder="البريد الإلكتروني" error={errors.email?.message} {...register('email')} />

      <Button type="submit" className="w-full" isLoading={forgotPassword.isPending}>
        إرسال رابط الاستعادة
      </Button>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          الرجوع لتسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
