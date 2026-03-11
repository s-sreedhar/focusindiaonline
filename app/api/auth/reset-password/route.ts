import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        const { uid, password, hashedPassword } = await req.json();

        if (!uid || !password || !hashedPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Update password in Firebase Auth
        await adminAuth.updateUser(uid, {
            password: password
        });

        // 2. Update hashed password in Firestore
        await adminDb.collection('users').doc(uid).update({
            password: hashedPassword
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
    }
}
