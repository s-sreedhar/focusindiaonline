'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { handleFirebaseError } from '@/lib/error-utils';

export function WishlistSync() {
    const { user } = useAuthStore();
    const { items, setItems } = useWishlistStore();
    const isFetching = useRef(false);

    // Sync from Firestore on login
    useEffect(() => {
        const syncFromFirestore = async () => {
            if (!user) return;
            isFetching.current = true; // Block writes while fetching

            try {
                const userId = user.id || (user as any).uid;
                if (!userId) return;

                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const firestoreWishlist = userData.wishlist || [];

                    if (firestoreWishlist.length > 0) {
                        const wishlistItems = [];
                        for (const bookId of firestoreWishlist) {
                            try {
                                const bookRef = doc(db, 'books', bookId);
                                const bookSnap = await getDoc(bookRef);
                                if (bookSnap.exists()) {
                                    const bookData = bookSnap.data();
                                    wishlistItems.push({
                                        bookId: bookSnap.id,
                                        title: bookData.title,
                                        author: bookData.author,
                                        price: bookData.price,
                                        image: bookData.image,
                                        slug: bookData.slug,
                                        addedAt: new Date().toISOString()
                                    });
                                }
                            } catch (err) {
                                //console.error(`Failed to fetch book ${bookId}`, err);
                            }
                        }

                        if (wishlistItems.length > 0) {
                            setItems(wishlistItems);
                        }
                    }
                }
            } catch (error) {
                //console.error('Error syncing wishlist from Firestore:', error);
                handleFirebaseError(error);
            } finally {
                isFetching.current = false;
            }
        };

        syncFromFirestore();
    }, [user, setItems]);

    // Sync TO Firestore on store change
    useEffect(() => {
        if (!user || isFetching.current) return;
        const userId = user.id || (user as any).uid;
        if (!userId) return;

        const wishlistIds = items.map(item => item.bookId);

        const writeWishlist = async () => {
            try {
                const { setDoc, doc } = await import('firebase/firestore');
                const userRef = doc(db, 'users', userId);
                await setDoc(userRef, { wishlist: wishlistIds }, { merge: true });
                // console.log('Wishlist synced to Firestore');
            } catch (error) {
                //console.error('Error syncing wishlist to Firestore:', error);
            }
        };

        const timeoutId = setTimeout(writeWishlist, 2000);
        return () => clearTimeout(timeoutId);

    }, [items, user]);

    return null;
}
