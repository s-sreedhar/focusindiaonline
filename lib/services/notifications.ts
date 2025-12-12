import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    orderBy,
    limit,
    onSnapshot
} from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'admin_notifications';

export type NotificationType = 'new_customer' | 'new_order' | 'potential_lead';

export interface AdminNotification {
    id?: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: any;
    // Metadata to help with redirection
    entityId?: string; // userId or orderId
    metadata?: any;
}

/**
 * Create a new notification
 */
export async function createNotification(
    type: NotificationType,
    title: string,
    message: string,
    entityId?: string,
    metadata: any = {}
) {
    try {
        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            type,
            title,
            message,
            read: false,
            createdAt: serverTimestamp(),
            entityId,
            metadata
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
    try {
        const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notifRef, {
            read: true,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
    try {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('read', '==', false)
        );
        const snapshot = await getDocs(q);
        const batchPromises = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true, updatedAt: serverTimestamp() })
        );
        await Promise.all(batchPromises);
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
}

/**
 * Subscribe to unread notifications (Real-time)
 */
export function subscribeToUnreadNotifications(callback: (notifications: AdminNotification[]) => void) {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as AdminNotification[];
        callback(notifications);
    });
}
