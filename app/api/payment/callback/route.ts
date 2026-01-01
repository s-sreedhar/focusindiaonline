import { NextResponse } from 'next/server';
import { verifyChecksum } from '@/lib/phonepe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { response } = body;
        const checksum = request.headers.get('x-verify') || '';

        if (!response || !checksum) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            );
        }

        // Verify checksum
        // Note: PhonePe documentation says for callback, the string to sign is base64Body + saltKey
        const isValid = verifyChecksum(response, checksum);

        if (!isValid) {
            //console.error('Invalid checksum in callback');
            return NextResponse.json(
                { error: 'Invalid checksum' },
                { status: 400 }
            );
        }

        const decodedData = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
        const { code, merchantTransactionId, data } = decodedData;

        if (code === 'PAYMENT_SUCCESS') {
            // Update order status in Firestore
            const orderRef = doc(db, 'orders', merchantTransactionId);
            await updateDoc(orderRef, {
                status: 'received',
                paymentStatus: 'paid',
                paymentId: data.transactionId, // PhonePe Transaction ID
                updatedAt: serverTimestamp()
            });

            // Send WhatsApp Notification to Admin
            try {
                const { getDoc } = require('firebase/firestore');
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    const { sendWhatsAppNotification } = require('@/lib/twilio');

                    const itemsList = orderData.items?.map((item: any) => `${item.title} (x${item.quantity})`).join(', ') || 'No items';

                    await sendWhatsAppNotification(
                        orderData.orderId || merchantTransactionId,
                        orderData.shippingAddress?.firstName || 'Customer',
                        orderData.totalAmount || 0,
                        itemsList
                    );
                }
            } catch (twilioError) {
                console.error("Failed to send WhatsApp notification:", twilioError);
                // Continue execution, don't fail the request
            }

            // Fetch order details to send email
            // We need to get the doc again to get the latest data or use what we have if possible
            // But we need items and user details which are in the doc
            // Since we are in a serverless function, we can just fetch it.
            // Note: In a high-scale system, we might want to decouple this (e.g., via a queue)
            // but for now, direct call is fine.

            try {
                const { getDoc } = require('firebase/firestore'); // Dynamic import to avoid top-level issues if any
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    const { sendOrderConfirmationEmail } = require('@/lib/email');

                    await sendOrderConfirmationEmail({
                        orderId: orderData.orderId,
                        customerName: orderData.shippingAddress?.firstName || 'Customer',
                        customerEmail: orderData.shippingAddress?.email,
                        items: orderData.items || [],
                        totalAmount: orderData.totalAmount
                    });
                }
            } catch (emailError) {
                //console.error("Failed to send confirmation email:", emailError);
                // We don't fail the request if email fails, just log it
            }
        } else {
            // Update order as failed
            const orderRef = doc(db, 'orders', merchantTransactionId);
            await updateDoc(orderRef, {
                paymentStatus: 'failed',
                failureReason: code,
                updatedAt: serverTimestamp()
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        //console.error('Callback API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
