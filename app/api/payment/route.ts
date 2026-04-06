import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const paymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    orderId: z.string().min(1, 'Order ID is required'),
    mobileNumber: z.string().optional()
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input with Zod
        const validationResult = paymentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { success: false, error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }

        const { amount, orderId } = validationResult.data;

        // Verify the order exists and amount matches
        const db = getAdminDb();
        const orderDoc = await db.collection('orders').doc(orderId).get();
        
        if (!orderDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        const orderData = orderDoc.data();
        if (orderData?.totalAmount !== amount) {
            console.error(`Amount mismatch for order ${orderId}: expected ${orderData?.totalAmount}, got ${amount}`);
            return NextResponse.json(
                { success: false, error: 'Amount mismatch' },
                { status: 400 }
            );
        }

        // Ensure receipt is max 40 chars (Razorpay limit)
        const receipt = orderId.substring(0, 40);

        // Create Razorpay Order
        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency: 'INR',
            receipt: receipt,
            payment_capture: 1, // Auto capture
            notes: {
                orderId: orderId, // Store full orderId in notes for webhook
            }
        };

        console.log(`Creating Razorpay order for ${orderId}, amount: ₹${amount}`);

        const razorpayOrder = await razorpay.orders.create(options);

        if (razorpayOrder && razorpayOrder.id) {
            // Store Razorpay order ID in our order for reference
            await db.collection('orders').doc(orderId).update({
                razorpayOrderId: razorpayOrder.id,
            });

            return NextResponse.json({
                success: true,
                keyId: process.env.RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                razorpayOrderId: razorpayOrder.id,
                orderId: orderId,
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Razorpay order creation failed' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error('Razorpay Payment API Error:', error.message, error.stack);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
