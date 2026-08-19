'use client';

import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { CallType } from '../types';
import { cn } from '@/lib/utils';

interface CallControlsProps {
  type: CallType;
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export function CallControls({ type, isMuted, isVideoEnabled, onToggleMute, onToggleCamera, onEndCall }: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onToggleMute}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
          isMuted ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'
        )}
        aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      {type === 'video' && (
        <button
          onClick={onToggleCamera}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            !isVideoEnabled ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'
          )}
          aria-label={isVideoEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
      )}

      <button
        onClick={onEndCall}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
        aria-label="إنهاء المكالمة"
      >
        <PhoneOff className="h-6 w-6" />
      </button>
    </div>
  );
}
