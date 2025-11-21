import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  phone?: string;
  role?: string;
  createdAt: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  initialize: () => () => void; // Returns unsubscribe function
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      logout: async () => {
        await signOut(auth);
        set({ user: null, isAuthenticated: false });
      },
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
      initialize: () => {
        return onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.phoneNumber || '',
              displayName: firebaseUser.displayName || 'User',
              phone: firebaseUser.phoneNumber || '',
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
              role: 'user', // In a real app, fetch this from Firestore
            };
            set({ user, isAuthenticated: true, loading: false });
          } else {
            set({ user: null, isAuthenticated: false, loading: false });
          }
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
