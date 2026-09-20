import { env } from '@/config/env';
import { CallType } from '../types';

type ConnectionStateHandler = (
  state: RTCPeerConnectionState
) => void;

type RemoteStreamHandler = (
  stream: MediaStream
) => void;

type IceCandidateHandler = (
  candidate: RTCIceCandidate
) => void;

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;

  private localStream: MediaStream | null = null;

  private remoteStream: MediaStream | null = null;

  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  private remoteDescriptionSet = false;

  private onConnectionStateChange:
    ConnectionStateHandler = () => {};

  private onRemoteStream:
    RemoteStreamHandler = () => {};

  private onIceCandidate:
    IceCandidateHandler = () => {};

  setHandlers(handlers: {
    onConnectionStateChange?: ConnectionStateHandler;
    onRemoteStream?: RemoteStreamHandler;
    onIceCandidate?: IceCandidateHandler;
  }) {
    if (handlers.onConnectionStateChange) {
      this.onConnectionStateChange =
        handlers.onConnectionStateChange;
    }

    if (handlers.onRemoteStream) {
      this.onRemoteStream =
        handlers.onRemoteStream;
    }

    if (handlers.onIceCandidate) {
      this.onIceCandidate =
        handlers.onIceCandidate;
    }
  }

  private buildIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [];

    /*
     * STUN
     */
    if (env.stunUrl) {
      servers.push({
        urls: env.stunUrl,
      });
    }

    /*
     * TURN
     */
    if (env.turnUrl) {
      servers.push({
        urls: env.turnUrl,
        username: env.turnUsername,
        credential: env.turnCredential,
      });
    }

    console.log(
      '[WebRTC] ICE servers configured:',
      servers.map((server) => ({
        urls: server.urls,
        hasUsername: Boolean(server.username),
        hasCredential: Boolean(
          server.credential
        ),
      }))
    );

    return servers;
  }

  createPeerConnection(): RTCPeerConnection {
    /*
     * Avoid accidentally creating two peer connections.
     */
    if (this.pc) {
      console.warn(
        '[WebRTC] PeerConnection already exists'
      );

      return this.pc;
    }

    console.log(
      '[WebRTC] Creating RTCPeerConnection'
    );

    this.remoteDescriptionSet = false;

    this.pendingIceCandidates = [];

    this.pc = new RTCPeerConnection({
      iceServers:
        this.buildIceServers(),
    });

    /*
     * ------------------------------------------------------------
     * ICE candidate generated locally
     * ------------------------------------------------------------
     */

    this.pc.onicecandidate = (
      event
    ) => {
      if (!event.candidate) {
        console.log(
          '[WebRTC] ICE gathering completed'
        );

        return;
      }

      console.log(
        '[WebRTC] Local ICE candidate:',
        {
          candidate:
            event.candidate.candidate,
          sdpMid:
            event.candidate.sdpMid,
          sdpMLineIndex:
            event.candidate.sdpMLineIndex,
          type:
            event.candidate.type,
        }
      );

      this.onIceCandidate(
        event.candidate
      );
    };

    /*
     * ------------------------------------------------------------
     * ICE errors
     * ------------------------------------------------------------
     */

    this.pc.onicecandidateerror = (
      event
    ) => {
      console.error(
        '[WebRTC] ICE candidate error:',
        {
          errorCode:
            event.errorCode,
          errorText:
            event.errorText,
          url:
            event.url,
        }
      );
    };

    /*
     * ------------------------------------------------------------
     * ICE gathering state
     * ------------------------------------------------------------
     */

    this.pc.onicegatheringstatechange =
      () => {
        if (!this.pc) {
          return;
        }

        console.log(
          '[WebRTC] iceGatheringState:',
          this.pc.iceGatheringState
        );
      };

    /*
     * ------------------------------------------------------------
     * ICE connection state
     * ------------------------------------------------------------
     */

    this.pc.oniceconnectionstatechange =
      () => {
        if (!this.pc) {
          return;
        }

        console.log(
          '[WebRTC] iceConnectionState:',
          this.pc.iceConnectionState
        );
      };

    /*
     * ------------------------------------------------------------
     * Signaling state
     * ------------------------------------------------------------
     */

    this.pc.onsignalingstatechange =
      () => {
        if (!this.pc) {
          return;
        }

        console.log(
          '[WebRTC] signalingState:',
          this.pc.signalingState
        );
      };

    /*
     * ------------------------------------------------------------
     * Peer connection state
     * ------------------------------------------------------------
     */

    this.pc.onconnectionstatechange =
      () => {
        if (!this.pc) {
          return;
        }

        console.log(
          '[WebRTC] connectionState:',
          this.pc.connectionState
        );

        this.onConnectionStateChange(
          this.pc.connectionState
        );
      };

    /*
     * ------------------------------------------------------------
     * Remote track
     * ------------------------------------------------------------
     */

    this.pc.ontrack = (
      event
    ) => {
      console.log(
        '[WebRTC] Remote track received:',
        {
          kind:
            event.track.kind,
          streams:
            event.streams.length,
        }
      );

      if (event.streams[0]) {
        this.remoteStream =
          event.streams[0];

        this.onRemoteStream(
          this.remoteStream
        );

        return;
      }

      /*
       * Fallback if browser does not
       * provide event.streams.
       */

      if (!this.remoteStream) {
        this.remoteStream =
          new MediaStream();
      }

      this.remoteStream.addTrack(
        event.track
      );

      this.onRemoteStream(
        this.remoteStream
      );
    };

    return this.pc;
  }

  async getLocalStream(
    type: CallType
  ): Promise<MediaStream> {
    console.log(
      '[WebRTC] Requesting local media:',
      type
    );

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,

            video:
              type === 'video'
                ? {
                    width: {
                      ideal: 1280,
                    },
                    height: {
                      ideal: 720,
                    },
                  }
                : false,
          }
        );

      this.localStream =
        stream;

      console.log(
        '[WebRTC] Local media obtained:',
        {
          audioTracks:
            stream.getAudioTracks()
              .length,
          videoTracks:
            stream.getVideoTracks()
              .length,
        }
      );

      if (!this.pc) {
        throw new Error(
          'Peer connection not initialized'
        );
      }

      stream
        .getTracks()
        .forEach((track) => {
          console.log(
            '[WebRTC] Adding local track:',
            track.kind
          );

          this.pc!.addTrack(
            track,
            stream
          );
        });

      return stream;
    } catch (err) {
      const error =
        err as DOMException;

      console.error(
        '[WebRTC] getUserMedia failed:',
        error
      );

      if (
        error.name ===
        'NotAllowedError'
      ) {
        throw new Error(
          'PERMISSION_DENIED'
        );
      }

      if (
        error.name ===
        'NotFoundError'
      ) {
        throw new Error(
          'DEVICE_UNAVAILABLE'
        );
      }

      throw new Error(
        'MEDIA_ERROR'
      );
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) {
      throw new Error(
        'Peer connection not initialized'
      );
    }

    console.log(
      '[WebRTC] Creating offer'
    );

    const offer =
      await this.pc.createOffer();

    console.log(
      '[WebRTC] Setting local offer'
    );

    await this.pc.setLocalDescription(
      offer
    );

    console.log(
      '[WebRTC] Local offer set:',
      this.pc.localDescription
    );

    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) {
      throw new Error(
        'Peer connection not initialized'
      );
    }

    console.log(
      '[WebRTC] Creating answer'
    );

    const answer =
      await this.pc.createAnswer();

    console.log(
      '[WebRTC] Setting local answer'
    );

    await this.pc.setLocalDescription(
      answer
    );

    console.log(
      '[WebRTC] Local answer set:',
      this.pc.localDescription
    );

    return answer;
  }

  async setRemoteDescription(
    sdp: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.pc) {
      throw new Error(
        'Peer connection not initialized'
      );
    }

    console.log(
      '[WebRTC] Setting remote description:',
      {
        type: sdp.type,
      }
    );

    await this.pc.setRemoteDescription(
      new RTCSessionDescription(sdp)
    );

    this.remoteDescriptionSet = true;

    console.log(
      '[WebRTC] Remote description set'
    );

    /*
     * Flush candidates that arrived
     * before the remote description.
     */

    if (
      this.pendingIceCandidates.length
    ) {
      console.log(
        '[WebRTC] Flushing pending ICE candidates:',
        this.pendingIceCandidates.length
      );

      const candidates =
        [...this.pendingIceCandidates];

      this.pendingIceCandidates = [];

      for (
        const candidate
        of candidates
      ) {
        await this.addIceCandidate(
          candidate
        );
      }
    }
  }

  async addIceCandidate(
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    if (!this.pc) {
      throw new Error(
        'Peer connection not initialized'
      );
    }

    /*
     * Important:
     *
     * ICE candidates must not be added
     * before remoteDescription exists.
     */

    if (
      !this.remoteDescriptionSet &&
      !this.pc.remoteDescription
    ) {
      console.log(
        '[WebRTC] Queueing ICE candidate because remote description is not set'
      );

      this.pendingIceCandidates.push(
        candidate
      );

      return;
    }

    console.log(
      '[WebRTC] Adding remote ICE candidate:',
      {
        candidate:
          candidate.candidate,
        sdpMid:
          candidate.sdpMid,
        sdpMLineIndex:
          candidate.sdpMLineIndex,
      }
    );

    const iceCandidate =
      new RTCIceCandidate(
        candidate
      );

    await this.pc.addIceCandidate(
      iceCandidate
    );

    console.log(
      '[WebRTC] Remote ICE candidate added'
    );
  }

  toggleAudio(
    enabled: boolean
  ): void {
    console.log(
      '[WebRTC] Audio enabled:',
      enabled
    );

    this.localStream
      ?.getAudioTracks()
      .forEach(
        (track) => {
          track.enabled =
            enabled;
        }
      );
  }

  toggleVideo(
    enabled: boolean
  ): void {
    console.log(
      '[WebRTC] Video enabled:',
      enabled
    );

    this.localStream
      ?.getVideoTracks()
      .forEach(
        (track) => {
          track.enabled =
            enabled;
        }
      );
  }

  getLocalStreamRef():
    MediaStream | null {
    return this.localStream;
  }

  closeConnection(): void {
    console.log(
      '[WebRTC] Closing connection'
    );

    this.localStream
      ?.getTracks()
      .forEach(
        (track) => track.stop()
      );

    this.remoteStream
      ?.getTracks()
      .forEach(
        (track) => track.stop()
      );

    this.pc?.close();

    this.pc = null;

    this.localStream = null;

    this.remoteStream = null;

    this.pendingIceCandidates = [];

    this.remoteDescriptionSet =
      false;
  }
}