'use client';

import { useToastStore } from './use-toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start justify-between rounded-lg border p-3 shadow-lg animate-in slide-in-from-bottom-2',
            t.variant === 'destructive' && 'border-red-200 bg-red-50',
            t.variant === 'success' && 'border-green-200 bg-green-50',
            (!t.variant || t.variant === 'default') && 'border-gray-200 bg-white'
          )}
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-gray-600">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
