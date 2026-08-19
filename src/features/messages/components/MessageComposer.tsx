'use client';

import { useState, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useSendMessage } from '../hooks/useMessages';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AttachmentDropzone } from '@/features/attachments/components/AttachmentDropzone';

export function MessageComposer({ conversationId }: { conversationId: number }) {
  const [body, setBody] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const sendMessage = useSendMessage();

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    sendMessage.mutate({ conversationId, body: trimmed });
    setBody('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-3">
      {showAttach && (
        <AttachmentDropzone conversationId={conversationId} onClose={() => setShowAttach(false)} />
      )}
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => setShowAttach((v) => !v)} aria-label="إرفاق ملف">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالة..."
          rows={1}
          className="max-h-32 min-h-10"
        />
        <Button size="icon" onClick={handleSend} disabled={!body.trim()} aria-label="إرسال">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
