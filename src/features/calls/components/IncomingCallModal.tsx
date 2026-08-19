'use client';

import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../providers/CallProvider';
import { Avatar } from '@/components/ui/avatar';

/**
 * Rendered once at the dashboard layout level (not per-conversation) so an
 * incoming call surfaces no matter which page the user is on.
 */
export function IncomingCallModal() {
  const { incomingCall, acceptIncoming, rejectIncoming, isAccepting } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
        <Avatar name="متصل" size="lg" className="mx-auto" />
        <p className="mt-3 text-base font-semibold text-gray-900">مكالمة {incomingCall.type === 'video' ? 'فيديو' : 'صوتية'} واردة</p>
        <p className="mt-1 text-xs text-gray-400">جاري الرنين...</p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            onClick={rejectIncoming}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
            aria-label="رفض"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            onClick={acceptIncoming}
            disabled={isAccepting}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            aria-label="قبول"
          >
            {incomingCall.type === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
