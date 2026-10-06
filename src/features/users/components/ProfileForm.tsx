'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';
import { Camera, Languages, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUpdateProfile } from '../hooks/useUsers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

const profileSchema = z.object({
  name: z.string().min(1, 'اكتب الاسم').max(100),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, 'حروف إنجليزية وأرقام فقط'),
  phone: z.string().optional().or(z.literal('')),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    if (typeof window === 'undefined') return 'ar';
    const savedLanguage = localStorage.getItem('locale');
    return savedLanguage === 'en' ? 'en' : 'ar';
  });
  const [isDarkMode, setIsDarkMode] = useState(() => (
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
  ));

  function changeLanguage(nextLanguage: 'ar' | 'en') {
    setLanguage(nextLanguage);
    localStorage.setItem('locale', nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';
  }

  function toggleDarkMode() {
    const nextIsDarkMode = !isDarkMode;
    setIsDarkMode(nextIsDarkMode);
    localStorage.setItem('theme', nextIsDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', nextIsDarkMode);
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', username: user?.username ?? '', phone: user?.phone ?? '' },
  });

  useEffect(() => {
    if (!user) return;
    reset({ name: user.name ?? '', username: user.username ?? '', phone: user.phone ?? '' });
  }, [reset, user]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode, language]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('avatar', file);
    updateProfile.mutate(formData);
  }

  function onSubmit(data: ProfileFormValues) {
    updateProfile.mutate({ ...data, phone: data.phone || undefined });
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-sm p-4">
      <h1 className="mb-6 text-xl font-bold text-gray-900">الملف الشخصي</h1>

      <div className="mb-6 flex flex-col items-center gap-2">
        <button onClick={() => fileInputRef.current?.click()} className="relative">
          <Avatar src={avatarPreview ?? user.avatar_url} name={user.name} size="lg" />
          <span className="absolute bottom-0 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input placeholder="الاسم الكامل" error={errors.name?.message} {...register('name')} />
        <Input placeholder="اسم المستخدم" error={errors.username?.message} {...register('username')} />
        <Input placeholder="رقم الهاتف" error={errors.phone?.message} {...register('phone')} />
        <Input value={user.email ?? ''} disabled placeholder="البريد الإلكتروني" />

        <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Languages className="h-4 w-4" />
              <span>اللغة</span>
            </div>
            <div className="flex rounded-md border border-gray-300 p-0.5 dark:border-gray-600">
              <button
                type="button"
                onClick={() => changeLanguage('ar')}
                className={`rounded px-3 py-1 text-xs transition-colors ${language === 'ar' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`rounded px-3 py-1 text-xs transition-colors ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                English
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>الوضع الليلي</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              aria-label="تبديل الوضع الليلي"
              onClick={toggleDarkMode}
              className={`relative h-6 w-11 rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={updateProfile.isPending}>
          حفظ التغييرات
        </Button>
      </form>
    </div>
  );
}
