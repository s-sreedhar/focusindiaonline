import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/phonepe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { sendWhatsAppNotification } from '@/lib/twilio';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const formData = await request.formData();
        const merchantId = formData.get('merchantId');
        const transactionId = formData.get('transactionId') as string;

        if (!transactionId || typeof transactionId !== 'string') {
            return NextResponse.redirect(new URL('/checkout/failure?reason=missing_transaction_id', request.url), 303);
        }

        // Basic sanity check for merchantId if needed, though strictly not required for logic flow
        if (merchantId && typeof merchantId !== 'string') {
            // Just ignore if invalid type, but good to check
        }

        // 1. Verify Payment Status with PhonePe API
        console.log('Checking status for:', transactionId);
        const statusResponse = await checkPaymentStatus(transactionId);
        console.log('PhonePe Status Response:', JSON.stringify(statusResponse, null, 2));
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        if (statusResponse && statusResponse.success && statusResponse.code === 'PAYMENT_SUCCESS') {
            // 2. Update Order in Firestore
            const orderRef = doc(db, 'orders', transactionId);

            // Check current status to avoid redundant updates
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists() && orderSnap.data().paymentStatus !== 'paid') {
                await updateDoc(orderRef, {
                    status: 'received',
                    paymentStatus: 'paid',
                    paymentId: statusResponse.data?.transactionId || 'PHONEPE_PAID',
                    updatedAt: serverTimestamp()
                });

                // Send WhatsApp Notification
                try {
                    const orderData = orderSnap.data();
                    const itemsList = orderData.items ? orderData.items.map((item: any) => `${item.title} (x${item.quantity})`).join(', ') : 'Items info unavailable';

                    await sendWhatsAppNotification(
                        transactionId, // Using transactionId as Order ID
                        orderData.shippingAddress?.fullName || orderData.shippingAddress?.firstName || 'Customer',
                        orderData.totalAmount,
                        itemsList
                    );
                } catch (err) {
                    console.error('Failed to send WhatsApp notification from status route:', err);
                }
            }

            return NextResponse.redirect(`${baseUrl}/checkout/success?orderId=${transactionId}`, 303);

        } else {
            // Payment Failed or Pending
            const failureReason = statusResponse?.code || 'PAYMENT_FAILED';
            const message = statusResponse?.message || 'Payment failed';

            const orderRef = doc(db, 'orders', transactionId);
            // Verify order exists before updating
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                await updateDoc(orderRef, {
                    paymentStatus: 'failed',
                    failureReason: failureReason,
                    updatedAt: serverTimestamp()
                });
            }

            return NextResponse.redirect(`${baseUrl}/checkout/failure?orderId=${transactionId}&reason=${failureReason}&message=${encodeURIComponent(message)}`, 303);
        }

    } catch (error) {
        //console.error('Status Redirect Error:', error);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/checkout/failure?reason=internal_error`, 303);
    }
}
