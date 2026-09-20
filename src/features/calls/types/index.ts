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

function unwrapRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const nested = record.call ?? record.data;
  const inner = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : record;
  if (inner.data && typeof inner.data === 'object' && !('id' in inner) && 'id' in (inner.data as object)) {
    return inner.data as Record<string, unknown>;
  }
  return inner;
}

function normalizeCallType(value: unknown): CallType | null {
  const t = String(value ?? '').toLowerCase();
  if (t === 'audio' || t === 'voice') return 'audio';
  if (t === 'video') return 'video';
  return null;
}

/** Laravel may send `{ call }`, a JsonResource, or the Call itself. */
export function parseIncomingCallPayload(payload: unknown): Call | null {
  const raw = unwrapRecord(payload);
  if (!raw) return null;

  const id = Number(raw.id);
  const type = normalizeCallType(raw.type ?? raw.call_type);
  if (!Number.isFinite(id) || !type) return null;

  return {
    id,
    conversation_id: Number(raw.conversation_id ?? raw.conversationId),
    caller_id: Number(raw.caller_id ?? raw.callerId),
    type,
    status: (raw.status as Call['status']) ?? 'ringing',
    started_at: (raw.started_at as string | null) ?? null,
    ended_at: (raw.ended_at as string | null) ?? null,
    created_at: (raw.created_at as string) ?? '',
  };
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
