import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  phone?: string;
  createdAt: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        
        const mockUser: User = {
          id: '1',
          email,
          username: email.split('@')[0],
          displayName: email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        set({ user: mockUser, isAuthenticated: true });
        console.log("[v0] User logged in:", email);
      },
      register: async (email: string, username: string, password: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!email || !username || !password) {
          throw new Error('All fields are required');
        }
        
        const mockUser: User = {
          id: '1',
          email,
          username,
          displayName: username,
          createdAt: new Date().toISOString(),
        };
        set({ user: mockUser, isAuthenticated: true });
        console.log("[v0] User registered:", email);
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        console.log("[v0] User logged out");
      },
      updateProfile: async (data: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
        console.log("[v0] Profile updated");
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
