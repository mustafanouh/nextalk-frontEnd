import { api } from '@/lib/axios';
import { Call, CallType } from '../types';

export const callsApi = {
  start: (conversationId: number, type: CallType) =>
    api.post<Call>(`/conversations/${conversationId}/calls`, { type }).then((r) => r.data),

  accept: (callId: number) => api.post<Call>(`/calls/${callId}/accept`).then((r) => r.data),

  reject: (callId: number) => api.post<Call>(`/calls/${callId}/reject`).then((r) => r.data),

  end: (callId: number) => api.post<Call>(`/calls/${callId}/end`).then((r) => r.data),

  // WebRTC signaling — see backend SignalingController note.
  sendOffer: (callId: number, sdp: RTCSessionDescriptionInit) =>
    api.post(`/calls/${callId}/signal/offer`, { sdp }),

  sendAnswer: (callId: number, sdp: RTCSessionDescriptionInit) =>
    api.post(`/calls/${callId}/signal/answer`, { sdp }),

  sendIceCandidate: (callId: number, candidate: RTCIceCandidateInit) =>
    api.post(`/calls/${callId}/signal/ice-candidate`, { candidate }),
};
