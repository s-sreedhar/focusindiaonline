import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/phonepe';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendWhatsAppNotification } from '@/lib/twilio';

// Use Admin SDK Timestamp
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const formData = await request.formData();
        const merchantId = formData.get('merchantId'); // PhonePe sends this
        const transactionId = formData.get('transactionId') as string;

        if (!transactionId || typeof transactionId !== 'string') {
            return NextResponse.redirect(new URL('/checkout/failure?reason=missing_transaction_id', request.url), 303);
        }

        console.log('🔍 Checking payment status for:', transactionId);

        // 1. Verify Payment Status with PhonePe API
        const statusResponse = await checkPaymentStatus(transactionId);
        console.log('📋 PhonePe Status Response:', JSON.stringify(statusResponse, null, 2));

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const db = getAdminDb();

        if (statusResponse && statusResponse.success && statusResponse.code === 'PAYMENT_SUCCESS') {
            // 2. Update Order in Firestore (Using Admin SDK)
            const orderRef = db.collection('orders').doc(transactionId);
            const orderSnap = await orderRef.get();

            if (orderSnap.exists) {
                const orderData = orderSnap.data();

                // Only update if not already paid
                if (orderData?.paymentStatus !== 'paid') {
                    await orderRef.update({
                        status: 'received',
                        paymentStatus: 'paid',
                        paymentId: statusResponse.data?.transactionId || statusResponse.data?.providerReferenceId || 'PHONEPE_PAID',
                        updatedAt: serverTimestamp()
                    });

                    // Send WhatsApp Notification
                    try {
                        const itemsList = orderData?.items ? orderData.items.map((item: any) => `${item.title} (x${item.quantity})`).join(', ') : 'Items info unavailable';

                        await sendWhatsAppNotification(
                            transactionId,
                            orderData?.shippingAddress?.fullName || orderData?.shippingAddress?.firstName || 'Customer',
                            orderData?.totalAmount || 0,
                            itemsList,
                            'SUCCESS'
                        );
                    } catch (err) {
                        console.error('⚠️ Failed to send WhatsApp notification:', err);
                    }
                }
            } else {
                console.error(`❌ Order ${transactionId} not found in Firestore during status check.`);
                // Even if order is missing locally, we redirect to success if Payment was success at PhonePe, 
                // but this is a critical data consistency issue.
            }

            return NextResponse.redirect(`${baseUrl}/checkout/success?orderId=${transactionId}`, 303);

        } else {
            // Payment Failed, Pending, or Cancelled from PhonePe side
            const failureReason = statusResponse?.code || 'PAYMENT_FAILED';
            const message = statusResponse?.message || 'Payment verification failed at provider.';

            console.warn(`⚠️ Payment not successful. Reason: ${failureReason}, Message: ${message}`);

            const orderRef = db.collection('orders').doc(transactionId);
            const orderSnap = await orderRef.get();

            if (orderSnap.exists) {
                await orderRef.update({
                    paymentStatus: 'failed',
                    failureReason: failureReason,
                    updatedAt: serverTimestamp()
                });

                // Send WhatsApp Notification for Failure
                try {
                    const orderData = orderSnap.data();
                    const itemsList = orderData?.items ? orderData.items.map((item: any) => `${item.title} (x${item.quantity})`).join(', ') : 'Items info unavailable';

                    await sendWhatsAppNotification(
                        transactionId,
                        orderData?.shippingAddress?.fullName || orderData?.shippingAddress?.firstName || 'Customer',
                        orderData?.totalAmount || 0,
                        itemsList,
                        'FAILED'
                    );
                } catch (err) {
                    console.error('⚠️ Failed to send WhatsApp failure notification:', err);
                }
            }

            return NextResponse.redirect(`${baseUrl}/checkout/failure?orderId=${transactionId}&reason=${failureReason}&message=${encodeURIComponent(message)}`, 303);
        }

    } catch (error: any) {
        console.error('❌ Status Route Internal Error:', error);
        console.error('Stack:', error.stack);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/checkout/failure?reason=internal_error&details=${encodeURIComponent(error.message)}`, 303);
    }
}
