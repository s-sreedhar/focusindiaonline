import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { Order } from '../types';

const ORDERS_COLLECTION = 'orders';

/**
 * Create a new order in Firestore
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const docRef = await addDoc(ordersRef, {
            ...orderData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
    }
};

/**
 * Get a single order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            return null;
        }

        return {
            id: orderSnap.id,
            ...orderSnap.data(),
        } as Order;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw new Error('Failed to fetch order');
    }
};

/**
 * Get all orders for a specific user
 */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
    try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const q = query(
            ordersRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data(),
            } as Order);
        });

        return orders;
    } catch (error) {
        console.error('Error fetching user orders:', error);
        throw new Error('Failed to fetch user orders');
    }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
): Promise<void> => {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        await updateDoc(orderRef, {
            status,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        throw new Error('Failed to update order status');
    }
};

/**
 * Update payment status
 */
import { createNotification } from './notifications';

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: Order['paymentStatus'],
    paymentId?: string
): Promise<void> => {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        const updateData: any = {
            paymentStatus,
            updatedAt: serverTimestamp(),
        };

        if (paymentId) {
            updateData.paymentId = paymentId;
        }

        await updateDoc(orderRef, updateData);

        // Notify Admin on success
        if (paymentStatus === 'completed') {
            const snap = await getDoc(orderRef);
            const order = snap.data();
            const amount = order?.totalAmount || 0;
            const userName = order?.shippingAddress?.firstName || 'Unknown User';

            await createNotification(
                'new_order',
                'New Order Placed',
                `Order #${orderId} confirmed for ₹${amount} by ${userName}.`,
                orderId
            );
        }

    } catch (error) {
        console.error('Error updating payment status:', error);
        throw new Error('Failed to update payment status');
    }
};

/**
 * Get all orders (admin function)
 */
export const getAllOrders = async (): Promise<Order[]> => {
    try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const q = query(ordersRef, orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data(),
            } as Order);
        });

        return orders;
    } catch (error) {
        console.error('Error fetching all orders:', error);
        throw new Error('Failed to fetch all orders');
    }
};
