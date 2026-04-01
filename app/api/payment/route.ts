import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { z } from 'zod';

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
                { error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }

        const { amount, orderId } = validationResult.data;

        // Create Razorpay Order
        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1, // Auto capture
        };

        const razorpayOrder = await razorpay.orders.create(options);

        if (razorpayOrder) {
            return NextResponse.json({
                success: true,
                keyId: process.env.RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                razorpayOrderId: razorpayOrder.id,
                orderId: orderId, // Our internal order ID
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Razorpay order creation failed' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error('Razorpay Payment API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
