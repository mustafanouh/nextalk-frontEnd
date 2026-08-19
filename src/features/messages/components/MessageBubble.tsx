'use client';

import { useState } from 'react';
import { Message } from '@/types/message';
import { cn, formatFileSize } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useDeleteMessage } from '../hooks/useMessages';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { File as FileIcon, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export function MessageBubble({ message }: { message: Message }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isMine = message.sender_id === currentUserId;
  const deleteMessage = useDeleteMessage(message.conversation_id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className={cn('group flex', isMine ? 'justify-start' : 'justify-end')}>
      <div className={cn('flex max-w-[70%] flex-col gap-1', isMine ? 'items-start' : 'items-end')}>
        <div
          className={cn(
            'relative rounded-2xl px-3.5 py-2 text-sm',
            isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900',
            message.status === 'failed' && 'opacity-60'
          )}
        >
          {message.attachments.length > 0 &&
            message.attachments.map((attachment) => (
              <div key={attachment.id} className="mb-1">
                {attachment.mime_type.startsWith('image/') ? (
                  <div className="relative h-40 w-56 overflow-hidden rounded-lg">
                    <Image src={attachment.url} alt={attachment.original_name} fill className="object-cover" />
                  </div>
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-2',
                      isMine ? 'border-white/20' : 'border-gray-200'
                    )}
                  >
                    <FileIcon className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{attachment.original_name}</p>
                      <p className="text-[10px] opacity-70">{formatFileSize(attachment.size)}</p>
                    </div>
                  </a>
                )}
              </div>
            ))}

          {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}

          {isMine && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="absolute -left-8 top-1/2 hidden -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 group-hover:block"
              aria-label="حذف الرسالة"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 px-1 text-[10px] text-gray-400">
          {message.status === 'sending' && <span>جاري الإرسال...</span>}
          {message.status === 'failed' && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3 w-3" /> فشل الإرسال
            </span>
          )}
          {!message.status && new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="حذف الرسالة؟"
        description="لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        isLoading={deleteMessage.isPending}
        onConfirm={() => {
          deleteMessage.mutate(message.id, { onSettled: () => setConfirmingDelete(false) });
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
