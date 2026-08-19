import { env } from '@/config/env';
import { CallType } from '../types';

type ConnectionStateHandler = (state: RTCPeerConnectionState) => void;
type RemoteStreamHandler = (stream: MediaStream) => void;
type IceCandidateHandler = (candidate: RTCIceCandidate) => void;

/**
 * Wraps a single RTCPeerConnection + local/remote MediaStreams for one call.
 * Instantiate one per call, discard after closeConnection(). Deliberately a
 * plain class (not a hook, not in Zustand/TanStack Query) — its objects are
 * not serializable and don't belong in React or cache state (plan rule 4).
 */
export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private onConnectionStateChange: ConnectionStateHandler = () => {};
  private onRemoteStream: RemoteStreamHandler = () => {};
  private onIceCandidate: IceCandidateHandler = () => {};

  setHandlers(handlers: {
    onConnectionStateChange?: ConnectionStateHandler;
    onRemoteStream?: RemoteStreamHandler;
    onIceCandidate?: IceCandidateHandler;
  }) {
    if (handlers.onConnectionStateChange) this.onConnectionStateChange = handlers.onConnectionStateChange;
    if (handlers.onRemoteStream) this.onRemoteStream = handlers.onRemoteStream;
    if (handlers.onIceCandidate) this.onIceCandidate = handlers.onIceCandidate;
  }

  private buildIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [{ urls: env.stunUrl }];
    if (env.turnUrl) {
      servers.push({ urls: env.turnUrl, username: env.turnUsername, credential: env.turnCredential });
    }
    return servers;
  }

  createPeerConnection(): RTCPeerConnection {
    this.pc = new RTCPeerConnection({ iceServers: this.buildIceServers() });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) this.onIceCandidate(event.candidate);
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc) this.onConnectionStateChange(this.pc.connectionState);
    };

    this.pc.ontrack = (event) => {
      if (!this.remoteStream) this.remoteStream = new MediaStream();
      event.streams[0]?.getTracks().forEach((track) => this.remoteStream!.addTrack(track));
      this.onRemoteStream(this.remoteStream);
    };

    return this.pc;
  }

  /**
   * Requests camera/mic and attaches tracks to the peer connection.
   * Throws a typed error the UI can distinguish (permission vs. device).
   */
  async getLocalStream(type: CallType): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720 } : false,
      });

      this.localStream = stream;

      if (this.pc) {
        stream.getTracks().forEach((track) => this.pc!.addTrack(track, stream));
      }

      return stream;
    } catch (err) {
      const error = err as DOMException;
      if (error.name === 'NotAllowedError') {
        throw new Error('PERMISSION_DENIED');
      }
      if (error.name === 'NotFoundError') {
        throw new Error('DEVICE_UNAVAILABLE');
      }
      throw new Error('MEDIA_ERROR');
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('Peer connection not initialized');
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('Peer connection not initialized');
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) throw new Error('Peer connection not initialized');
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) throw new Error('Peer connection not initialized');
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // Benign in practice: candidates that arrive before the remote
      // description is set are safe to drop — ICE gathering retries.
    }
  }

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((track) => (track.enabled = enabled));
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((track) => (track.enabled = enabled));
  }

  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  /** Stops all tracks (releases camera/mic) and tears down the connection. */
  closeConnection(): void {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream?.getTracks().forEach((track) => track.stop());
    this.pc?.close();

    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
  }
}
