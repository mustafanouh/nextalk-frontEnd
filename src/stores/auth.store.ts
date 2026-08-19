import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';
import { TOKEN_STORAGE_KEY } from '@/lib/axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setSession: (user, token) => {
        // Axios reads the raw token straight from localStorage (see lib/axios.ts)
        // to avoid a lib -> store circular import; keep both in sync here.
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (user) => set({ user }),

      clearSession: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'nextalk-auth',
      // Only persist what's needed to restore a session on reload;
      // isAuthenticated is derived, but persisting it too avoids a
      // flash-of-logged-out on first paint before hydration finishes.
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
