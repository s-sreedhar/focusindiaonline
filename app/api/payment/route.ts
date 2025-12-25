import { NextResponse } from 'next/server';
import {
    PHONEPE_MERCHANT_ID,
    PHONEPE_BASE_URL,
    base64Encode,
    generateChecksum
} from '@/lib/phonepe';

import { z } from 'zod';

const paymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    orderId: z.string().min(1, 'Order ID is required'),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number format') // Basic Indian mobile validation
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

        const { amount, orderId, mobileNumber } = validationResult.data;

        const origin = request.headers.get('origin');
        const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
            //console.error('PhonePe Error:', data);
            return NextResponse.json(
                { success: false, error: data.message || 'Payment initiation failed' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        //console.error('Payment API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
