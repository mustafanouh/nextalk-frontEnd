import { create } from 'zustand';

interface ChatState {
  selectedConversationId: number | null;
  isMobileConversationOpen: boolean; // controls list<->view transition on mobile
  setSelectedConversation: (id: number | null) => void;
  openMobileConversation: () => void;
  closeMobileConversation: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  selectedConversationId: null,
  isMobileConversationOpen: false,

  setSelectedConversation: (id) =>
    set({ selectedConversationId: id, isMobileConversationOpen: id !== null }),

  openMobileConversation: () => set({ isMobileConversationOpen: true }),
  closeMobileConversation: () => set({ isMobileConversationOpen: false }),
}));
