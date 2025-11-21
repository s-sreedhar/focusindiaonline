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
        return onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              // Fetch user details from Firestore
              const { doc, getDoc } = await import('firebase/firestore');
              const { db } = await import('./firebase');

              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const userDoc = await getDoc(userDocRef);

              if (userDoc.exists()) {
                const userData = userDoc.data();
                const user: User = {
                  id: firebaseUser.uid,
                  email: userData.email || firebaseUser.email || '',
                  username: userData.username || firebaseUser.phoneNumber || '',
                  displayName: userData.displayName || firebaseUser.displayName || 'User',
                  phone: userData.phone || firebaseUser.phoneNumber || '',
                  createdAt: userData.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
                  role: userData.role || 'customer',
                };
                set({ user, isAuthenticated: true, loading: false });
              } else {
                // Fallback if user doc doesn't exist yet (e.g. during first login before creation)
                const user: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  username: firebaseUser.phoneNumber || '',
                  displayName: firebaseUser.displayName || 'User',
                  phone: firebaseUser.phoneNumber || '',
                  createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                  role: 'customer',
                };
                set({ user, isAuthenticated: true, loading: false });
              }
            } catch (error) {
              console.error("Error fetching user details:", error);
              // Fallback on error
              const user: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: firebaseUser.phoneNumber || '',
                displayName: firebaseUser.displayName || 'User',
                phone: firebaseUser.phoneNumber || '',
                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                role: 'customer',
              };
              set({ user, isAuthenticated: true, loading: false });
            }
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
