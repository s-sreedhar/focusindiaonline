import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  bookId: string;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  slug: string;
  weight?: number; // Weight in grams
  type?: 'book' | 'test_series';
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  appliedCoupon: { code: string; type: 'percentage' | 'fixed'; value: number; minPurchaseAmount: number } | null;
  applyCoupon: (coupon: any) => void;
  removeCoupon: () => void;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(i => i.bookId === item.bookId);
          if (existingItem) {
            return {
              items: state.items.map(i =>
                i.bookId === item.bookId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (bookId) => {
        set((state) => ({
          items: state.items.filter(i => i.bookId !== bookId),
        }));
      },
      updateQuantity: (bookId, quantity) => {
        set((state) => ({
          items: state.items.map(i =>
            i.bookId === bookId
              ? { ...i, quantity: Math.max(1, quantity) }
              : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      appliedCoupon: null,
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'cart-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
