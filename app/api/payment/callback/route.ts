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
            console.error('Invalid checksum in callback');
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
                paymentStatus: 'paid',
                paymentId: data.transactionId, // PhonePe Transaction ID
                updatedAt: serverTimestamp()
            });
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
        console.error('Callback API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
