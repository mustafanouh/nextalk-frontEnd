'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { X, Upload, Loader2 } from 'lucide-react';
import { useSendAttachment } from '@/features/messages/hooks/useMessages';
import { formatFileSize, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Mirrors StoreMessageRequest's mimetypes rule on the backend — frontend
// validation is UX only, Laravel re-validates the real file regardless.
const ACCEPTED_MIME = {
  'image/jpeg': [],
  'image/png': [],
  'image/webp': [],
  'image/gif': [],
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
  'application/zip': [],
  'text/plain': [],
};
const MAX_SIZE = 20 * 1024 * 1024; // 20MB, matches backend `max:20480`

interface AttachmentDropzoneProps {
  conversationId: number;
  onClose: () => void;
}

export function AttachmentDropzone({ conversationId, onClose }: AttachmentDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const sendAttachment = useSendAttachment();
  const { toast } = useToast();

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        toast({
          title: 'ملف غير مقبول',
          description: rejections[0].errors[0]?.message ?? 'تحقق من نوع أو حجم الملف',
          variant: 'destructive',
        });
        return;
      }
      const selected = accepted[0];
      if (!selected) return;
      setFile(selected);
      setPreview(selected.type.startsWith('image/') ? URL.createObjectURL(selected) : null);
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  function handleSend() {
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    sendAttachment.mutate(
      { conversationId, type, file, onProgress: setProgress },
      {
        onSuccess: () => {
          setFile(null);
          setPreview(null);
          setProgress(0);
          onClose();
        },
      }
    );
  }

  return (
    <div className="mb-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed p-4 text-center text-xs text-gray-500',
            isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-5 w-5 text-gray-400" />
          <p>اسحب ملف هنا أو اضغط للاختيار (حد أقصى 20 ميجا)</p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={file.name} className="h-14 w-14 rounded-md object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
              ملف
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-700">{file.name}</p>
            <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
            {sendAttachment.isPending && (
              <div className="mt-1 h-1 w-full overflow-hidden rounded bg-gray-200">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="text-gray-400 hover:text-red-500"
            disabled={sendAttachment.isPending}
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={sendAttachment.isPending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {sendAttachment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'إرسال'}
          </button>
        </div>
      )}
    </div>
  );
}
