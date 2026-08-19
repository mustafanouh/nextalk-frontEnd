'use client';

import { useCall } from '../providers/CallProvider';
import { CallControls } from './CallControls';
import { CallStatus } from './CallStatus';
import { LocalVideo, RemoteVideo } from './CallVideo';
import { Avatar } from '@/components/ui/avatar';

/**
 * Rendered once at the dashboard layout level, same reasoning as
 * IncomingCallModal — a call can be active while navigating between pages.
 */
export function CallScreen() {
  const {
    currentCall,
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    mediaError,
    toggleMute,
    toggleCamera,
    endCall,
  } = useCall();

  if (!currentCall || callState === 'idle') return null;

  const isVideoCall = currentCall.type === 'video';
  const showRemoteVideo = isVideoCall && remoteStream && callState === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      <div className="relative flex-1">
        {showRemoteVideo ? (
          <RemoteVideo stream={remoteStream} className="h-full w-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Avatar name="مكالمة" size="lg" />
            <CallStatus state={callState} />
          </div>
        )}

        {mediaError && (
          <div className="absolute inset-x-0 top-4 mx-auto w-fit rounded-md bg-red-600/90 px-3 py-1.5 text-xs text-white">
            {mediaError === 'PERMISSION_DENIED' && 'تم رفض إذن الكاميرا/الميكروفون'}
            {mediaError === 'DEVICE_UNAVAILABLE' && 'لا يوجد جهاز كاميرا/ميكروفون متاح'}
            {mediaError === 'MEDIA_ERROR' && 'حدث خطأ في الوصول للوسائط'}
          </div>
        )}

        {isVideoCall && localStream && isVideoEnabled && (
          <div className="absolute bottom-4 left-4 h-32 w-24 overflow-hidden rounded-lg border-2 border-white/20 shadow-lg sm:h-40 sm:w-28">
            <LocalVideo stream={localStream} />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 bg-black/40 p-6">
        <CallStatus state={callState} />
        <CallControls
          type={currentCall.type}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={endCall}
        />
      </div>
    </div>
  );
}
