import { useCallback, useRef, useState } from 'react';
import { WebRTCService } from './WebRTCService';
import { CallType } from '../types';

interface UseWebRTCOptions {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

/**
 * Owns one WebRTCService instance per hook lifetime (call). The service
 * itself is a useRef (never re-created on render); only the MediaStream
 * *references* used for rendering <video> elements live in useState, since
 * a video element needs a stream reference to bind to, and that binding
 * must survive re-renders. The RTCPeerConnection itself is never exposed
 * to state (plan rule 4).
 */
export function useWebRTC({ onIceCandidate, onConnectionStateChange }: UseWebRTCOptions) {
  const serviceRef = useRef<WebRTCService>(new WebRTCService());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<'PERMISSION_DENIED' | 'DEVICE_UNAVAILABLE' | 'MEDIA_ERROR' | null>(null);

  const init = useCallback(
    async (type: CallType) => {
      const service = serviceRef.current;
      service.setHandlers({
        onIceCandidate,
        onConnectionStateChange,
        onRemoteStream: (stream) => setRemoteStream(stream),
      });

      service.createPeerConnection();

      try {
        const stream = await service.getLocalStream(type);
        setLocalStream(stream);
        setMediaError(null);
        return stream;
      } catch (err) {
        setMediaError((err as Error).message as 'PERMISSION_DENIED' | 'DEVICE_UNAVAILABLE' | 'MEDIA_ERROR');
        throw err;
      }
    },
    [onIceCandidate, onConnectionStateChange]
  );

  const createOffer = useCallback(() => serviceRef.current.createOffer(), []);
  const createAnswer = useCallback(() => serviceRef.current.createAnswer(), []);
  const setRemoteDescription = useCallback(
    (sdp: RTCSessionDescriptionInit) => serviceRef.current.setRemoteDescription(sdp),
    []
  );
  const addIceCandidate = useCallback(
    (candidate: RTCIceCandidateInit) => serviceRef.current.addIceCandidate(candidate),
    []
  );

  const toggleAudio = useCallback((enabled: boolean) => serviceRef.current.toggleAudio(enabled), []);
  const toggleVideo = useCallback((enabled: boolean) => serviceRef.current.toggleVideo(enabled), []);

  const cleanup = useCallback(() => {
    serviceRef.current.closeConnection();
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  return {
    localStream,
    remoteStream,
    mediaError,
    init,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    cleanup,
  };
}
