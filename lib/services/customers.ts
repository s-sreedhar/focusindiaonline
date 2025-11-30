import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { Customer } from '../types';

const CUSTOMERS_COLLECTION = 'customers';

/**
 * Create a new customer profile
 */
export const createCustomer = async (
    uid: string,
    customerData: Omit<Customer, 'uid' | 'createdAt'>
): Promise<void> => {
    try {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, uid);
        await setDoc(customerRef, {
            ...customerData,
            uid,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        throw new Error('Failed to create customer profile');
    }
};

/**
 * Get customer profile by UID
 */
export const getCustomer = async (uid: string): Promise<Customer | null> => {
    try {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, uid);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
            return null;
        }

        return {
            uid: customerSnap.id,
            ...customerSnap.data(),
        } as Customer;
    } catch (error) {
        console.error('Error fetching customer:', error);
        throw new Error('Failed to fetch customer profile');
    }
};

/**
 * Update customer profile
 */
export const updateCustomer = async (
    uid: string,
    updates: Partial<Customer>
): Promise<void> => {
    try {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, uid);
        await updateDoc(customerRef, updates);
    } catch (error) {
        console.error('Error updating customer:', error);
        throw new Error('Failed to update customer profile');
    }
};

/**
 * Add item to customer's wishlist
 */
export const addToWishlist = async (uid: string, bookId: string): Promise<void> => {
    try {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, uid);
        await updateDoc(customerRef, {
            wishlist: arrayUnion(bookId),
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        throw new Error('Failed to add to wishlist');
    }
};

/**
 * Remove item from customer's wishlist
 */
export const removeFromWishlist = async (uid: string, bookId: string): Promise<void> => {
    try {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, uid);
        await updateDoc(customerRef, {
            wishlist: arrayRemove(bookId),
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        throw new Error('Failed to remove from wishlist');
    }
};

/**
 * Add order ID to customer's order history
 */
export const addOrderToCustomer = async (uid: string, orderId: string): Promise<void> => {
    try {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, uid);
        await updateDoc(customerRef, {
            orders: arrayUnion(orderId),
        });
    } catch (error) {
        console.error('Error adding order to customer:', error);
        throw new Error('Failed to add order to customer');
    }
};
