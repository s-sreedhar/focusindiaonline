import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Book } from './types';

interface CompareStore {
    comparedBooks: Book[];
    addToCompare: (book: Book) => void;
    removeFromCompare: (bookId: string) => void;
    clearCompare: () => void;
    isInCompare: (bookId: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
    persist(
        (set, get) => ({
            comparedBooks: [],
            addToCompare: (book) => {
                const current = get().comparedBooks;
                if (current.find((b) => b.id === book.id)) return;
                if (current.length >= 4) {
                    // You might want to show a toast here, but store shouldn't handle UI side effects directly usually.
                    // For now just limiting silently or replace oldest? 
                    // Let's limit to 4.
                    return;
                }
                set({ comparedBooks: [...current, book] });
            },
            removeFromCompare: (bookId) => {
                set({
                    comparedBooks: get().comparedBooks.filter((b) => b.id !== bookId),
                });
            },
            clearCompare: () => set({ comparedBooks: [] }),
            isInCompare: (bookId) => {
                return !!get().comparedBooks.find(b => b.id === bookId);
            }
        }),
        {
            name: 'compare-storage',
        }
    )
);
