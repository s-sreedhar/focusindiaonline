import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET() {
    try {
        console.log('🧪 Testing Firebase Admin initialization...');
        
        // Test Admin Auth
        const adminAuth = getAdminAuth();
        console.log('✅ Admin Auth initialized');
        
        // Test Admin DB
        const adminDb = getAdminDb();
        console.log('✅ Admin DB initialized');
        
        // Try to list some users (just to verify it works)
        const listResult = await adminAuth.listUsers(1);
        console.log('✅ Successfully listed users');
        
        return NextResponse.json({
            success: true,
            message: 'Firebase Admin is working correctly',
            userCount: listResult.users.length
        });
    } catch (error: any) {
        console.error('❌ Firebase Admin test failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                code: error.code,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
