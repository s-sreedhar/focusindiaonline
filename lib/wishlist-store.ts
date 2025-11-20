import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  bookId: string;
  title: string;
  author: string;
  price: number;
  image: string;
  slug: string;
  addedAt: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'addedAt'> & { addedAt: Date }) => void;
  removeItem: (bookId: string) => void;
  isInWishlist: (bookId: string) => boolean;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const exists = state.items.find(i => i.bookId === item.bookId);
          if (exists) return state;
          return { 
            items: [...state.items, { 
              ...item, 
              addedAt: item.addedAt.toISOString() 
            }] 
          };
        });
      },
      removeItem: (bookId) => {
        set((state) => ({
          items: state.items.filter(i => i.bookId !== bookId),
        }));
      },
      isInWishlist: (bookId) => {
        return get().items.some(i => i.bookId === bookId);
      },
      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
