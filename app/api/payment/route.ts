import { NextResponse } from 'next/server';
import {
    PHONEPE_MERCHANT_ID,
    PHONEPE_BASE_URL,
    base64Encode,
    generateChecksum
} from '@/lib/phonepe';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, orderId, mobileNumber } = body;

        if (!amount || !orderId || !mobileNumber) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const callbackUrl = `${baseUrl}/api/payment/callback`;
        const redirectUrl = `${baseUrl}/api/payment/status/${orderId}`;

        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: orderId,
            merchantUserId: 'MUID' + mobileNumber.slice(-4),
            amount: amount * 100, // Amount in paisa
            redirectUrl: redirectUrl,
            redirectMode: 'POST',
            callbackUrl: callbackUrl,
            mobileNumber: mobileNumber,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        const base64Payload = base64Encode(payload);
        const endpoint = '/pg/v1/pay';
        const checksum = generateChecksum(base64Payload, endpoint);

        const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
            },
            body: JSON.stringify({
                request: base64Payload
            })
        });

        const data = await response.json();

        if (data.success) {
            return NextResponse.json({
                success: true,
                url: data.data.instrumentResponse.redirectInfo.url,
                merchantTransactionId: data.data.merchantTransactionId
            });
        } else {
            console.error('PhonePe Error:', data);
            return NextResponse.json(
                { success: false, error: data.message || 'Payment initiation failed' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error('Payment API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
