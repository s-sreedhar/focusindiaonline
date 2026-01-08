import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { generateOrderId } from '@/lib/utils/order-id';

// Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, userId, shippingAddress, subtotal, shippingCharges, discount, appliedCoupon, totalAmount, userProfile, isGuest } = body;

        // Basic Validation
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const db = getAdminDb();
        const orderId = generateOrderId();
        let transactionError = null;

        await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
            // 1. READS: Check stock for all items
            const bookReads: { ref: admin.firestore.DocumentReference, item: any }[] = [];
            for (const item of items) {
                if (item.type === 'test_series') continue; // Skip stock check for digital items
                const bookRef = db.collection('books').doc(item.bookId);
                bookReads.push({ ref: bookRef, item });
            }

            const bookDocs = await Promise.all(bookReads.map(b => transaction.get(b.ref)));

            // Validate all stocks
            bookDocs.forEach((bookDoc, index) => {
                const { item } = bookReads[index];
                if (!bookDoc.exists) {
                    throw new Error(`Book "${item.title}" not found`);
                }
                const bookData = bookDoc.data();
                const currentStock = bookData?.stockQuantity ?? bookData?.stock ?? 0;

                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for "${item.title}". Available: ${currentStock}`);
                }
            });

            // 2. WRITES: All updates and creations

            // Update stock
            bookDocs.forEach((bookDoc, index) => {
                const { ref, item } = bookReads[index];
                const bookData = bookDoc.data();
                const currentStock = bookData?.stockQuantity ?? bookData?.stock ?? 0;

                transaction.update(ref, {
                    stockQuantity: currentStock - item.quantity
                });
            });

            // Create Order
            const newOrderRef = db.collection('orders').doc(orderId);
            transaction.create(newOrderRef, {
                orderId,
                userId,
                items,
                shippingAddress,
                paymentMethod: 'PHONEPE',
                subtotal,
                shippingCharges,
                discount,
                appliedCoupon: appliedCoupon || null,
                totalAmount,
                status: 'payment_pending',
                paymentStatus: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update User Profile (create if guest)
            const userRef = db.collection('users').doc(userId);

            if (isGuest) {
                // For guest, we might be creating the user for the first time or updating
                transaction.set(userRef, {
                    uid: userId, // Ensure UID matches doc ID
                    ...userProfile,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    role: 'guest'
                }, { merge: true });
            } else {
                // For logged in user, just update address/profile
                transaction.set(userRef, {
                    ...userProfile,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        });

        return NextResponse.json({ success: true, orderId });

    } catch (error: any) {
        console.error('❌ Order Creation API Error:', error);
        console.error('Error Stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}
