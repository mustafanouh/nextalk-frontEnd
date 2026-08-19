'use client';

import { Phone, Video } from 'lucide-react';
import { useCall } from '../providers/CallProvider';
import { Button } from '@/components/ui/button';

export function CallButtons({ conversationId }: { conversationId: number }) {
  const { startCall, isStarting, callState } = useCall();
  const disabled = isStarting || callState !== 'idle';

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" disabled={disabled} onClick={() => startCall(conversationId, 'audio')} aria-label="مكالمة صوتية">
        <Phone className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" disabled={disabled} onClick={() => startCall(conversationId, 'video')} aria-label="مكالمة فيديو">
        <Video className="h-5 w-5" />
      </Button>
    </div>
  );
}
