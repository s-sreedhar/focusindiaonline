'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirebaseError } from '@/lib/error-utils';
import { debounce } from '@/lib/utils';

// Helper to debounce writes
const debouncedWriteCart = debounce(async (userId: string, items: { bookId: string; quantity: number }[]) => {
    try {
        const userRef = doc(db, 'users', userId);
        // We overwrite the entire cart array for simplicity and consistency
        await setDoc(userRef, { cart: items }, { merge: true });
        // console.log('Cart synced to Firestore');
    } catch (error) {
        //console.error('Error syncing cart to Firestore:', error);
    }
}, 2000); // 2 second debounce

export function CartSync() {
    const { user } = useAuthStore();
    const { items, addItem, clearCart, hasHydrated } = useCartStore();
    // Use a ref to track if we're in the initial fetch phase to avoid overwriting remote with empty local
    const isFetchingRef = useRef(false);

    // Sync FROM Firestore on login
    useEffect(() => {
        const syncFromFirestore = async () => {
            if (!user) return;
            const userId = user.id || (user as any).uid;
            if (!userId) return;

            isFetchingRef.current = true;
            try {
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const firestoreCart = userData.cart || [];

                    if (Array.isArray(firestoreCart) && firestoreCart.length > 0) {
                        for (const cartItem of firestoreCart) {
                            try {
                                const bookRef = doc(db, 'books', cartItem.bookId);
                                const bookSnap = await getDoc(bookRef);
                                if (bookSnap.exists()) {
                                    const bookData = bookSnap.data();
                                    // Add to store (this handles quantity merging if item exists)
                                    addItem({
                                        bookId: bookSnap.id,
                                        title: bookData.title,
                                        author: bookData.author,
                                        price: bookData.price,
                                        originalPrice: bookData.originalPrice,
                                        image: bookData.image,
                                        quantity: cartItem.quantity || 1,
                                        slug: bookData.slug,
                                    });
                                }
                            } catch (err) {
                                //console.error(`Failed to fetch book ${cartItem.bookId}`, err);
                            }
                        }
                    }
                }
            } catch (error) {
                //console.error('Error fetching cart from Firestore:', error);
            } finally {
                isFetchingRef.current = false;
            }
        };

        syncFromFirestore();
    }, [user, addItem]);

    // Sync TO Firestore on store change
    useEffect(() => {
        if (!user || isFetchingRef.current || !hasHydrated) return;
        const userId = user.id || (user as any).uid;
        if (!userId) return;

        // Map store items to simple ID/Quantity objects
        const cartData = items.map(item => ({
            bookId: item.bookId,
            quantity: item.quantity
        }));

        debouncedWriteCart(userId, cartData);
    }, [items, user, hasHydrated]);

    return null;
}
