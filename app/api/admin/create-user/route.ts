import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/admin';

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();
        const digits = String(phone || '').replace(/\D/g, '');
        if (digits.length !== 10) {
            return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
        }
        if (!adminAuth) {
            console.error('Firebase Admin Auth is not initialized. Check environment variables:');
            console.error('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
            console.error('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing');
            console.error('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing');
            return NextResponse.json({
                error: 'Firebase Admin not configured. Please check server environment variables.'
            }, { status: 500 });
        }
        const e164 = `+91${digits}`;
        console.log('Creating user with phone:', e164);
        const record = await adminAuth.createUser({ phoneNumber: e164 });
        console.log('User created successfully:', record.uid);
        return NextResponse.json({ uid: record.uid });
    } catch (e: any) {
        console.error('Error creating user:', e);

        // Handle specific Firebase Auth errors
        if (e.code === 'auth/phone-number-already-exists') {
            return NextResponse.json({
                error: 'A user with this phone number already exists. Please use a different phone number.'
            }, { status: 409 });
        }

        return NextResponse.json({
            error: e.message || 'Failed to create user. Please try again.'
        }, { status: 500 });
    }
}
