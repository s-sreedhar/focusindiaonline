import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updatePaymentStatus, updateOrderStatus } from '@/lib/services/orders';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !webhookSecret) {
            console.error('Missing signature or webhook secret');
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid HMAC signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);
        // console.log('Razorpay Webhook Event:', event.event);

        // Handle the event
        if (event.event === 'order.paid' || event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            // The order identifier could be in notes or receipt
            const orderId = payment.notes?.orderId || event.payload.order?.entity.receipt;
            const razorpayPaymentId = payment.id;

            if (orderId) {
                // Update statuses in Firestore
                await updatePaymentStatus(orderId, 'completed', razorpayPaymentId);
                await updateOrderStatus(orderId, 'processing');
                // console.log(`Order ${orderId} updated to processing/completed via webhook`);
            } else {
                console.warn('Webhook: Order ID not found in payload', JSON.stringify(event.payload, null, 2));
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('Razorpay Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
