import { create } from 'zustand';
import { Call, CallUiState } from '@/features/calls/types';

interface CallState {
  currentCall: Call | null;
  callState: CallUiState;
  incomingCall: Call | null;
  isMuted: boolean;
  isVideoEnabled: boolean;

  setIncomingCall: (call: Call | null) => void;
  startOutgoing: (call: Call) => void;
  transitionTo: (state: CallUiState) => void;
  setCurrentCall: (call: Call | null) => void;
  toggleMuted: () => void;
  toggleVideo: () => void;
  reset: () => void;
}

const initialState = {
  currentCall: null,
  callState: 'idle' as CallUiState,
  incomingCall: null,
  isMuted: false,
  isVideoEnabled: true,
};

export const useCallStore = create<CallState>((set) => ({
  ...initialState,

  setIncomingCall: (call) =>
    set({ incomingCall: call, callState: call ? 'ringing' : 'idle' }),

  startOutgoing: (call) =>
    set({ currentCall: call, callState: 'calling', isVideoEnabled: call.type === 'video' }),

  transitionTo: (state) => set({ callState: state }),

  setCurrentCall: (call) => set({ currentCall: call }),

  toggleMuted: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleVideo: () => set((s) => ({ isVideoEnabled: !s.isVideoEnabled })),

  reset: () => set(initialState),
}));
