import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        console.log('🔑 Custom token endpoint called');
        
        const { uid } = await request.json();
        console.log('Received UID:', uid);

        if (!uid) {
            console.error('❌ No UID provided');
            return NextResponse.json(
                { error: 'UID is required' },
                { status: 400 }
            );
        }

        // Initialize Firebase Admin Auth
        console.log('Initializing Firebase Admin Auth...');
        const adminAuth = getAdminAuth();
        console.log('✅ Firebase Admin Auth initialized');
        
        // Create custom token directly (skip Firestore check for now)
        console.log('Creating custom token for UID:', uid);
        const customToken = await adminAuth.createCustomToken(uid);
        console.log('✅ Custom token created successfully');
        console.log('Token length:', customToken.length);

        return NextResponse.json({ customToken });
    } catch (error: any) {
        console.error('❌ Error creating custom token:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        return NextResponse.json(
            { 
                error: error.message || 'Failed to create custom token',
                code: error.code,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
