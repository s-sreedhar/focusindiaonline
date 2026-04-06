import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderPaymentAndStatusAdmin } from '@/lib/services/orders-admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !webhookSecret) {
            console.error('Webhook: Missing signature or webhook secret');
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Webhook: Invalid HMAC signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);
        console.log('Razorpay Webhook Event:', event.event);

        // Handle payment success events
        if (event.event === 'order.paid' || event.event === 'payment.captured') {
            const payment = event.payload.payment?.entity;
            
            if (!payment) {
                console.warn('Webhook: No payment entity in payload');
                return NextResponse.json({ status: 'ok', message: 'No payment entity' });
            }

            // The order identifier could be in notes or receipt
            const orderId = payment.notes?.orderId || event.payload.order?.entity?.receipt;
            const razorpayPaymentId = payment.id;

            if (orderId) {
                console.log(`Webhook: Processing payment for order ${orderId}`);
                
                const result = await updateOrderPaymentAndStatusAdmin(
                    orderId, 
                    'completed', 
                    'processing', 
                    razorpayPaymentId
                );

                if (result.success) {
                    console.log(`Webhook: Order ${orderId} updated successfully`);
                } else {
                    console.error(`Webhook: Failed to update order ${orderId}:`, result.error);
                }
            } else {
                console.warn('Webhook: Order ID not found in payload', JSON.stringify({
                    notes: payment.notes,
                    receipt: event.payload.order?.entity?.receipt,
                }, null, 2));
            }
        }

        // Handle payment failure
        if (event.event === 'payment.failed') {
            const payment = event.payload.payment?.entity;
            const orderId = payment?.notes?.orderId || event.payload.order?.entity?.receipt;
            
            if (orderId) {
                console.log(`Webhook: Payment failed for order ${orderId}`);
                await updateOrderPaymentAndStatusAdmin(orderId, 'failed', 'payment_pending');
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('Razorpay Webhook Error:', error.message, error.stack);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
