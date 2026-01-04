import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/admin';

export async function POST(req: Request) {
    try {
        const { uid } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (!adminAuth) {
            return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
        }

        // Delete user from Firebase Auth
        await adminAuth.deleteUser(uid);

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (e: any) {
        console.error('Error deleting user:', e);
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
    }
}
