import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        // Axios interceptor e use korte global e set
        if (typeof window !== "undefined") {
          window.__authToken = accessToken;
        }

        // Login er pore socket connect
        connectSocket(accessToken);

        set({ user, accessToken, isAuthenticated: true });
      },

      updateUser: (updatedFields) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        }));
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          window.__authToken = undefined;
        }

        // Logout er pore socket disconnect
        disconnectSocket();

        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      // Shudhu user persist korbo — token refresh diye fresh nibo
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
