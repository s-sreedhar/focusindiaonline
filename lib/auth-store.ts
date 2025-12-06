import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export interface User {
  id: string;
  username: string;
  displayName: string;
  phone: string;
  role?: string;
  createdAt: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  authMethod?: 'firebase' | 'custom';
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
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      logout: async () => {
        console.log('[AuthStore] Logging out...');
        await signOut(auth);
        set({ user: null, isAuthenticated: false });
        console.log('[AuthStore] Logged out successfully');
      },
      setUser: (user: User | null) => {
        console.log('[AuthStore] Setting user:', user ? { id: user.id, role: user.role } : null);
        set({ user, isAuthenticated: !!user });
      },
      initialize: () => {
        console.log('[AuthStore] Initializing auth listener...');

        return onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('[AuthStore] Auth state changed:', firebaseUser ? 'User logged in' : 'No user');

          if (firebaseUser) {
            try {
              // Fetch user details from Firestore
              const { doc, getDoc } = await import('firebase/firestore');
              const { db } = await import('./firebase');

              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const userDoc = await getDoc(userDocRef);

              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('[AuthStore] User document found:', {
                  uid: firebaseUser.uid,
                  role: userData.role,
                  displayName: userData.displayName
                });

                const user: User = {
                  id: firebaseUser.uid,
                  username: userData.phone || firebaseUser.phoneNumber || userData.username || '',
                  displayName: userData.displayName || firebaseUser.displayName || 'User',
                  phone: userData.phone || firebaseUser.phoneNumber || '',
                  createdAt: userData.createdAt?.toDate?.()?.toISOString() || firebaseUser.metadata.creationTime || new Date().toISOString(),
                  role: userData.role || 'customer',
                  address: userData.address,
                  authMethod: 'firebase'
                };

                set({ user, isAuthenticated: true, loading: false });
                console.log('[AuthStore] User state updated successfully');
              } else {
                // Fallback if user doc doesn't exist yet
                console.warn('[AuthStore] User document not found in Firestore, using Firebase Auth data');

                const user: User = {
                  id: firebaseUser.uid,
                  username: firebaseUser.phoneNumber || '',
                  displayName: firebaseUser.displayName || 'User',
                  phone: firebaseUser.phoneNumber || '',
                  createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                  role: 'customer',
                  authMethod: 'firebase'
                };

                set({ user, isAuthenticated: true, loading: false });
              }
            } catch (error) {
              console.error('[AuthStore] Error fetching user details:', error);

              // Fallback on error
              const user: User = {
                id: firebaseUser.uid,
                username: firebaseUser.phoneNumber || '',
                displayName: firebaseUser.displayName || 'User',
                phone: firebaseUser.phoneNumber || '',
                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                role: 'customer',
                authMethod: 'firebase'
              };

              set({ user, isAuthenticated: true, loading: false });
            }
          } else {
            // Check if we are using custom auth (password login)
            const currentUser = get().user;
            if (currentUser?.authMethod === 'custom') {
              console.log('[AuthStore] Custom auth session active, ignoring Firebase logout');
              set({ loading: false });
            } else {
              console.log('[AuthStore] No user, setting state to unauthenticated');
              set({ user: null, isAuthenticated: false, loading: false });
            }
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
