'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

function useAttachStream(stream: MediaStream | null) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return ref;
}

export function LocalVideo({ stream, muted = true, className }: VideoProps) {
  const ref = useAttachStream(stream);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn('h-full w-full rounded-lg object-cover [transform:scaleX(-1)]', className)}
    />
  );
}

export function RemoteVideo({ stream, className }: VideoProps) {
  const ref = useAttachStream(stream);
  return <video ref={ref} autoPlay playsInline className={cn('h-full w-full object-cover', className)} />;
}
