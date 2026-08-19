export type CallType = 'audio' | 'video';

// Backend-persisted status (Call model)
export type CallStatus = 'ringing' | 'active' | 'rejected' | 'missed' | 'ended';

// Frontend UI state machine — richer than backend status because it also
// tracks local-only phases (connecting, failed) that never reach the DB.
export type CallUiState =
  | 'idle'
  | 'calling' // we initiated, waiting for callee
  | 'ringing' // we are the callee, being rung
  | 'connecting' // accepted, WebRTC handshake in progress
  | 'connected'
  | 'ending'
  | 'ended'
  | 'rejected'
  | 'missed'
  | 'failed';

export interface Call {
  id: number;
  conversation_id: number;
  caller_id: number;
  type: CallType;
  status: CallStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface IncomingCallPayload {
  call: Call;
}

export interface SdpPayload {
  call_id: number;
  from_user_id: number;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  call_id: number;
  from_user_id: number;
  candidate: RTCIceCandidateInit;
}
