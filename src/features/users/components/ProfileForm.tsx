'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
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

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, username: user?.username, phone: user?.phone ?? '' },
  });

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
        <Input value={user.email} disabled placeholder="البريد الإلكتروني" />

        <Button type="submit" className="w-full" isLoading={updateProfile.isPending}>
          حفظ التغييرات
        </Button>
      </form>
    </div>
  );
}
