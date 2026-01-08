import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const db = getAdminDb();
        const auth = getAdminAuth();

        // Attempt to list collections (or just read root)
        const collections = await db.listCollections();
        const collectionIds = collections.map(c => c.id);

        return NextResponse.json({
            success: true,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'focusindiaonline-ea702',
            serviceAccountSet: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
            individualVarsSet: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
            collections: collectionIds,
            message: 'Firebase Admin connected successfully'
        });

    } catch (error: any) {
        console.error('Test Connection Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            details: error.stack,
            envCheck: {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                serviceAccountKeyLen: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length,
                privateKeyLen: process.env.FIREBASE_PRIVATE_KEY?.length
            }
        }, { status: 500 });
    }
}
