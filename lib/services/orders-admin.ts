import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const ORDERS_COLLECTION = 'orders';
const NOTIFICATIONS_COLLECTION = 'admin_notifications';

/**
 * Update order payment and status using Admin SDK (for webhooks/server-side)
 */
export async function updateOrderPaymentAndStatusAdmin(
    orderId: string,
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded',
    orderStatus: 'payment_pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    paymentId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);

        const updateData: Record<string, any> = {
            status: orderStatus,
            paymentStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (paymentId) {
            updateData.paymentId = paymentId;
        }

        await orderRef.update(updateData);

        // Create notification for successful payment
        if (paymentStatus === 'completed') {
            try {
                const orderSnap = await orderRef.get();
                if (orderSnap.exists) {
                    const order = orderSnap.data();
                    const amount = order?.totalAmount || 0;
                    const userName = order?.shippingAddress?.fullName || 
                                   order?.shippingAddress?.firstName || 
                                   'Unknown User';

                    await db.collection(NOTIFICATIONS_COLLECTION).add({
                        type: 'new_order',
                        title: 'New Order Placed',
                        message: `Order #${orderId} confirmed for ₹${amount} by ${userName}.`,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        entityId: orderId,
                        metadata: {
                            amount,
                            userName,
                        }
                    });
                }
            } catch (notifyError) {
                console.error('Failed to create notification:', notifyError);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error updating order status (Admin):', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get order by ID using Admin SDK
 */
export async function getOrderAdmin(orderId: string) {
    try {
        const db = getAdminDb();
        const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            return null;
        }

        return {
            id: orderSnap.id,
            ...orderSnap.data(),
        };
    } catch (error) {
        console.error('Error fetching order (Admin):', error);
        return null;
    }
}
