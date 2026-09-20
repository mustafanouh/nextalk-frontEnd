import {
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { useMutation } from '@tanstack/react-query';

import { callsApi } from '../api/calls.api';

import { useWebRTC } from '../webrtc/useWebRTC';

import { Ringtone } from '../webrtc/Ringtone';

import { useCallStore } from '@/stores/call.store';

import { getEcho } from '@/lib/echo';

import {
  queryClient,
  queryKeys,
} from '@/lib/query-client';

import {
  CallType,
  SdpPayload,
  IceCandidatePayload,
} from '../types';

import { ApiError } from '@/types/api';

import { useToast } from '@/components/ui/use-toast';

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

  const hasInitializedMedia = useRef(false);

  const pendingIceQueue = useRef<
    RTCIceCandidateInit[]
  >([]);

  const ringtoneRef = useRef<Ringtone>(
    new Ringtone()
  );

  /*
   * ------------------------------------------------------------
   * Ringtone
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const ringtone = ringtoneRef.current;

    if (callState === 'ringing') {
      ringtone.play('ringing');
    } else if (callState === 'calling') {
      ringtone.play('ringback');
    } else {
      ringtone.stop();
    }

    return () => {
      ringtone.stop();
    };
  }, [callState]);

  useEffect(() => {
    return () => {
      ringtoneRef.current.stop();
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * WebRTC
   * ------------------------------------------------------------
   */

  const webrtc = useWebRTC({
    onIceCandidate: (candidate) => {
      if (!currentCall) {
        console.warn(
          '[Call] ICE candidate generated but no current call'
        );

        return;
      }

      console.log(
        '[Call] Sending ICE candidate:',
        currentCall.id
      );

      void callsApi.sendIceCandidate(
        currentCall.id,
        candidate.toJSON()
      );
    },

    onConnectionStateChange: (state) => {
      console.log(
        '[Call] WebRTC connection state:',
        state
      );

      if (state === 'connected') {
        transitionTo('connected');
      }

      if (
        state === 'failed' ||
        state === 'closed'
      ) {
        const currentState =
          useCallStore.getState().callState;

        if (
          currentState !== 'ended' &&
          currentState !== 'rejected' &&
          currentState !== 'missed'
        ) {
          transitionTo('failed');
        }
      }
    },
  });

  /*
   * ------------------------------------------------------------
   * Start call
   * ------------------------------------------------------------
   */

  const startCallMutation = useMutation({
    mutationFn: ({
      conversationId,
      type,
    }: {
      conversationId: number;
      type: CallType;
    }) =>
      callsApi.start(
        conversationId,
        type
      ),

    onSuccess: (call) => {
      console.log(
        '[Call] Call created successfully:',
        call
      );

      startOutgoing(call);
    },

    onError: (error: ApiError) => {
      console.error(
        '[Call] Failed to start call:',
        error
      );

      toast({
        title: 'تعذر بدء المكالمة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /*
   * ------------------------------------------------------------
   * Accept
   * ------------------------------------------------------------
   */

  const acceptCallMutation = useMutation({
    mutationFn: (callId: number) =>
      callsApi.accept(callId),

    onSuccess: (call) => {
      console.log(
        '[Call] Call accepted:',
        call
      );

      setCurrentCall(call);

      setIncomingCall(null);

      transitionTo('connecting');
    },

    onError: (error: ApiError) => {
      console.error(
        '[Call] Failed to accept call:',
        error
      );
    },
  });

  /*
   * ------------------------------------------------------------
   * Reject
   * ------------------------------------------------------------
   */

  const rejectCallMutation = useMutation({
    mutationFn: (callId: number) =>
      callsApi.reject(callId),

    onSuccess: () => {
      console.log(
        '[Call] Call rejected'
      );

      setIncomingCall(null);

      transitionTo('idle');
    },

    onError: (error: ApiError) => {
      console.error(
        '[Call] Failed to reject call:',
        error
      );
    },
  });

  /*
   * ------------------------------------------------------------
   * End call
   * ------------------------------------------------------------
   */

  const endCallMutation = useMutation({
    mutationFn: (callId: number) =>
      callsApi.end(callId),

    onSettled: () => {
      cleanupCall('ended');
    },
  });

  /*
   * ------------------------------------------------------------
   * Cleanup
   * ------------------------------------------------------------
   */

  const cleanupCall = useCallback(
    (
      finalState:
        | 'ended'
        | 'rejected'
        | 'missed'
        | 'failed'
    ) => {
      console.log(
        '[Call] Cleaning up:',
        finalState
      );

      webrtc.cleanup();

      hasInitializedMedia.current = false;

      pendingIceQueue.current = [];

      transitionTo(finalState);

      setTimeout(() => {
        reset();
      }, 1500);

      queryClient.invalidateQueries({
        queryKey: queryKeys.calls,
      });
    },
    [
      webrtc,
      transitionTo,
      reset,
    ]
  );

  /*
   * ------------------------------------------------------------
   * Public actions
   * ------------------------------------------------------------
   */

  const startCall = useCallback(
    (
      conversationId: number,
      type: CallType
    ) => {
      console.log(
        '[Call] Starting call:',
        {
          conversationId,
          type,
        }
      );

      startCallMutation.mutate({
        conversationId,
        type,
      });
    },
    [startCallMutation]
  );

  const acceptIncoming = useCallback(() => {
    if (!incomingCall) {
      return;
    }

    console.log(
      '[Call] Accepting incoming call:',
      incomingCall.id
    );

    acceptCallMutation.mutate(
      incomingCall.id
    );
  }, [
    incomingCall,
    acceptCallMutation,
  ]);

  const rejectIncoming = useCallback(() => {
    if (!incomingCall) {
      return;
    }

    console.log(
      '[Call] Rejecting incoming call:',
      incomingCall.id
    );

    rejectCallMutation.mutate(
      incomingCall.id
    );
  }, [
    incomingCall,
    rejectCallMutation,
  ]);

  const endCall = useCallback(() => {
    if (!currentCall) {
      return;
    }

    console.log(
      '[Call] Ending call:',
      currentCall.id
    );

    endCallMutation.mutate(
      currentCall.id
    );
  }, [
    currentCall,
    endCallMutation,
  ]);

  const toggleMute = useCallback(() => {
    webrtc.toggleAudio(
      isMuted
    );

    toggleMuted();
  }, [
    webrtc,
    isMuted,
    toggleMuted,
  ]);

  const toggleCamera = useCallback(() => {
    webrtc.toggleVideo(
      !isVideoEnabled
    );

    toggleVideoState();
  }, [
    webrtc,
    isVideoEnabled,
    toggleVideoState,
  ]);

  /*
   * ------------------------------------------------------------
   * Call presence channel + WebRTC signaling
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!currentCall) {
      return;
    }

    const callId = currentCall.id;

    console.log(
      '[Call] Joining call channel:',
      `call.${callId}`
    );

    const echo = getEcho();

    const channel =
      echo.join(`call.${callId}`);

    async function initMediaOnce() {
      if (
        hasInitializedMedia.current
      ) {
        return;
      }

      hasInitializedMedia.current = true;

      console.log(
        '[WebRTC] Initializing media'
      );

      try {
        await webrtc.init(
          currentCall.type
        );

        console.log(
          '[WebRTC] Media initialized'
        );

        /*
         * Flush ICE candidates that arrived
         * before media initialization.
         *
         * NOTE:
         * WebRTCService will additionally protect
         * against candidates arriving before the
         * remote description.
         */

        for (
          const candidate
          of pendingIceQueue.current
        ) {
          await webrtc.addIceCandidate(
            candidate
          );
        }

        pendingIceQueue.current = [];
      } catch (error) {
        console.error(
          '[WebRTC] Media initialization failed:',
          error
        );

        toast({
          title:
            'تعذر الوصول للكاميرا/الميكروفون',
          variant: 'destructive',
        });

        cleanupCall('failed');
      }
    }

    channel
      .here(async (users) => {
        console.log(
          '[Call] Presence here:',
          users
        );

        await initMediaOnce();
      })

      .joining(async (user) => {
        console.log(
          '[Call] User joined call channel:',
          user
        );

        await initMediaOnce();

        const state =
          useCallStore.getState().callState;

        /*
         * Only the caller creates the offer.
         */
        if (
          state === 'calling' ||
          state === 'connecting'
        ) {
          console.log(
            '[WebRTC] Creating offer'
          );

          try {
            const offer =
              await webrtc.createOffer();

            console.log(
              '[WebRTC] Sending offer'
            );

            await callsApi.sendOffer(
              callId,
              offer
            );
          } catch (error) {
            console.error(
              '[WebRTC] Failed to create/send offer:',
              error
            );

            cleanupCall('failed');
          }
        }
      })

      .listen(
        '.CallAccepted',
        () => {
          console.log(
            '[Call] CallAccepted received'
          );

          transitionTo(
            'connecting'
          );
        }
      )

      .listen(
        '.CallRejected',
        () => {
          console.log(
            '[Call] CallRejected received'
          );

          cleanupCall(
            'rejected'
          );
        }
      )

      .listen(
        '.CallEnded',
        () => {
          console.log(
            '[Call] CallEnded received'
          );

          cleanupCall(
            'ended'
          );
        }
      )

      .listen(
        '.WebRTCOffer',
        async (
          payload: SdpPayload
        ) => {
          console.log(
            '[WebRTC] Offer received:',
            payload
          );

          try {
            await initMediaOnce();

            await webrtc.setRemoteDescription(
              payload.sdp
            );

            const answer =
              await webrtc.createAnswer();

            console.log(
              '[WebRTC] Sending answer'
            );

            await callsApi.sendAnswer(
              callId,
              answer
            );
          } catch (error) {
            console.error(
              '[WebRTC] Offer handling failed:',
              error
            );

            cleanupCall(
              'failed'
            );
          }
        }
      )

      .listen(
        '.WebRTCAnswer',
        async (
          payload: SdpPayload
        ) => {
          console.log(
            '[WebRTC] Answer received:',
            payload
          );

          try {
            await webrtc.setRemoteDescription(
              payload.sdp
            );
          } catch (error) {
            console.error(
              '[WebRTC] Failed to apply answer:',
              error
            );

            cleanupCall(
              'failed'
            );
          }
        }
      )

      .listen(
        '.ICECandidate',
        async (
          payload: IceCandidatePayload
        ) => {
          console.log(
            '[WebRTC] ICE candidate received:',
            payload
          );

          if (
            !hasInitializedMedia.current
          ) {
            pendingIceQueue.current.push(
              payload.candidate
            );

            return;
          }

          try {
            await webrtc.addIceCandidate(
              payload.candidate
            );
          } catch (error) {
            console.error(
              '[WebRTC] Failed to add ICE candidate:',
              error
            );
          }
        }
      );

    return () => {
      console.log(
        '[Call] Leaving call channel:',
        `call.${callId}`
      );

      echo.leave(
        `call.${callId}`
      );
    };

    // currentCall.id is intentionally the lifecycle key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCall?.id]);

  return {
    currentCall,
    callState,
    incomingCall,

    isMuted,
    isVideoEnabled,

    localStream:
      webrtc.localStream,

    remoteStream:
      webrtc.remoteStream,

    mediaError:
      webrtc.mediaError,

    startCall,
    acceptIncoming,
    rejectIncoming,
    endCall,

    toggleMute,
    toggleCamera,

    isStarting:
      startCallMutation.isPending,

    isAccepting:
      acceptCallMutation.isPending,
  };
}