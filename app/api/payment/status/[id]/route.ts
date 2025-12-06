import { NextResponse } from 'next/server';
import { verifyChecksum } from '@/lib/phonepe';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const formData = await request.formData();
        const merchantId = formData.get('merchantId');
        const transactionId = formData.get('transactionId');
        const code = formData.get('code');
        const providerReferenceId = formData.get('providerReferenceId');
        const amount = formData.get('amount');
        const checksum = formData.get('checksum');

        // In a real scenario, you might want to verify the checksum here as well
        // But since the callback handles the actual status update, this is mainly for UX redirection

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        if (code === 'PAYMENT_SUCCESS') {
            return NextResponse.redirect(`${baseUrl}/checkout/success?orderId=${transactionId}`, 303);
        } else {
            return NextResponse.redirect(`${baseUrl}/checkout/failure?orderId=${transactionId}&reason=${code}`, 303);
        }

    } catch (error) {
        console.error('Status Redirect Error:', error);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/checkout/failure?reason=error`, 303);
    }
}
