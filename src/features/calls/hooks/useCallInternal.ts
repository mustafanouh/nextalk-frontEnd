import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { callsApi } from '../api/calls.api';
import { useWebRTC } from '../webrtc/useWebRTC';
import { useCallStore } from '@/stores/call.store';
import { getEcho } from '@/lib/echo';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useToast } from '@/components/ui/use-toast';
import { CallType, SdpPayload, IceCandidatePayload } from '../types';
import { ApiError } from '@/types/api';

export function useCallInternal() {
  const { toast } = useToast();
  const {
    currentCall,
    callState,
    incomingCall,
    isMuted,
    isVideoEnabled,
    startOutgoing,
    transitionTo,
    setCurrentCall,
    setIncomingCall,
    toggleMuted,
    toggleVideo: toggleVideoState,
    reset,
  } = useCallStore();

  // Guards against double-init if effects re-run (React strict mode / fast refresh).
  const hasInitializedMedia = useRef(false);
  const pendingIceQueue = useRef<RTCIceCandidateInit[]>([]);

  const webrtc = useWebRTC({
    onIceCandidate: (candidate) => {
      if (currentCall) callsApi.sendIceCandidate(currentCall.id, candidate.toJSON());
    },
    onConnectionStateChange: (state) => {
      if (state === 'connected') transitionTo('connected');
      if (state === 'failed' || state === 'closed') {
        if (callState !== 'ended' && callState !== 'rejected' && callState !== 'missed') {
          transitionTo('failed');
        }
      }
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────
  const startCallMutation = useMutation({
    mutationFn: ({ conversationId, type }: { conversationId: number; type: CallType }) =>
      callsApi.start(conversationId, type),
    onSuccess: (call) => startOutgoing(call),
    onError: (error: ApiError) =>
      toast({ title: 'تعذر بدء المكالمة', description: error.message, variant: 'destructive' }),
  });

  const acceptCallMutation = useMutation({
    mutationFn: (callId: number) => callsApi.accept(callId),
    onSuccess: (call) => {
      setCurrentCall(call);
      setIncomingCall(null);
      transitionTo('connecting');
    },
  });

  const rejectCallMutation = useMutation({
    mutationFn: (callId: number) => callsApi.reject(callId),
    onSuccess: () => {
      setIncomingCall(null);
      transitionTo('idle');
    },
  });

  const endCallMutation = useMutation({
    mutationFn: (callId: number) => callsApi.end(callId),
    onSettled: () => cleanupCall('ended'),
  });

  // ── Cleanup: release camera/mic, close peer connection, reset state ─
  const cleanupCall = useCallback(
    (finalState: 'ended' | 'rejected' | 'missed' | 'failed') => {
      webrtc.cleanup();
      hasInitializedMedia.current = false;
      pendingIceQueue.current = [];
      transitionTo(finalState);
      setTimeout(() => reset(), 1500); // brief "call ended" flash before clearing UI
      queryClient.invalidateQueries({ queryKey: queryKeys.calls });
    },
    [webrtc, transitionTo, reset]
  );

  // ── Public actions ───────────────────────────────────────────────
  const startCall = useCallback(
    (conversationId: number, type: CallType) => startCallMutation.mutate({ conversationId, type }),
    [startCallMutation]
  );

  const acceptIncoming = useCallback(() => {
    if (incomingCall) acceptCallMutation.mutate(incomingCall.id);
  }, [incomingCall, acceptCallMutation]);

  const rejectIncoming = useCallback(() => {
    if (incomingCall) rejectCallMutation.mutate(incomingCall.id);
  }, [incomingCall, rejectCallMutation]);

  const endCall = useCallback(() => {
    if (currentCall) endCallMutation.mutate(currentCall.id);
  }, [currentCall, endCallMutation]);

  const toggleMute = useCallback(() => {
    webrtc.toggleAudio(isMuted); // isMuted is the state *before* this toggle
    toggleMuted();
  }, [webrtc, isMuted, toggleMuted]);

  const toggleCamera = useCallback(() => {
    webrtc.toggleVideo(!isVideoEnabled);
    toggleVideoState();
  }, [webrtc, isVideoEnabled, toggleVideoState]);

  // ── Presence channel: joins once a call exists, handles full signaling ──
  useEffect(() => {
    if (!currentCall) return;

    const echo = getEcho();
    const channel = echo.join(`call.${currentCall.id}`);

    async function initMediaOnce() {
      if (hasInitializedMedia.current || !currentCall) return;
      hasInitializedMedia.current = true;
      try {
        await webrtc.init(currentCall.type);
        for (const candidate of pendingIceQueue.current) {
          await webrtc.addIceCandidate(candidate);
        }
        pendingIceQueue.current = [];
      } catch {
        toast({ title: 'تعذر الوصول للكاميرا/الميكروفون', variant: 'destructive' });
        cleanupCall('failed');
      }
    }

    channel
      .here(async () => {
        await initMediaOnce();
      })
      .joining(async () => {
        // The other participant just joined (callee accepted) — the side that
        // initiated the call (state 'calling'/'connecting') creates the offer.
        await initMediaOnce();
        const state = useCallStore.getState().callState;
        if (state === 'calling' || state === 'connecting') {
          const offer = await webrtc.createOffer();
          callsApi.sendOffer(currentCall.id, offer);
        }
      })
      .listen('.CallAccepted', () => {
        transitionTo('connecting');
      })
      .listen('.CallRejected', () => {
        cleanupCall('rejected');
      })
      .listen('.CallEnded', () => {
        cleanupCall('ended');
      })
      .listen('.WebRTCOffer', async ({ sdp }: SdpPayload) => {
        await initMediaOnce();
        await webrtc.setRemoteDescription(sdp);
        const answer = await webrtc.createAnswer();
        callsApi.sendAnswer(currentCall.id, answer);
      })
      .listen('.WebRTCAnswer', async ({ sdp }: SdpPayload) => {
        await webrtc.setRemoteDescription(sdp);
      })
      .listen('.ICECandidate', async ({ candidate }: IceCandidatePayload) => {
        if (hasInitializedMedia.current) {
          await webrtc.addIceCandidate(candidate);
        } else {
          pendingIceQueue.current.push(candidate);
        }
      });

    return () => {
      echo.leave(`call.${currentCall.id}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCall?.id]);

  return {
    currentCall,
    callState,
    incomingCall,
    isMuted,
    isVideoEnabled,
    localStream: webrtc.localStream,
    remoteStream: webrtc.remoteStream,
    mediaError: webrtc.mediaError,
    startCall,
    acceptIncoming,
    rejectIncoming,
    endCall,
    toggleMute,
    toggleCamera,
    isStarting: startCallMutation.isPending,
    isAccepting: acceptCallMutation.isPending,
  };
}
