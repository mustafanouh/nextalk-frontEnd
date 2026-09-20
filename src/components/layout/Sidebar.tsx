'use client';

import Link from 'next/link';
import { MessageCircle, LogOut, Phone } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <nav className="flex w-16 shrink-0 flex-col items-center justify-between border-l border-gray-200 bg-white py-4">
      <div className="flex flex-col items-center gap-4">
        <Link href="/chat" className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" aria-label="المحادثات">
          <MessageCircle className="h-5 w-5" />
        </Link>
        <Link href="/calls" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="سجل المكالمات">
          <Phone className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link href="/profile" aria-label="الملف الشخصي">
          <Avatar src={user?.avatar_thumb_url} name={user?.name ?? '?'} size="sm" />
        </Link>
        <button onClick={() => logout.mutate()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500" aria-label="تسجيل الخروج">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
