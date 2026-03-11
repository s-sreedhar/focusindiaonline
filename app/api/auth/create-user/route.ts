import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        const { name, email, phone, password, hashedPassword } = await req.json();

        if (!name || !email || !phone || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Format phone number
        const cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length !== 10) {
            return NextResponse.json({ error: 'Phone number must be strictly 10 digits' }, { status: 400 });
        }
        const formattedPhone = `+91${cleanedPhone}`;

        // Validate duplicates server-side first
        try {
            const [emailRecord, phoneRecord] = await Promise.all([
                adminAuth.getUserByEmail(email).catch(() => null),
                adminAuth.getUserByPhoneNumber(formattedPhone).catch(() => null)
            ]);

            if (emailRecord) {
                return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
            }
            if (phoneRecord) {
                return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 409 });
            }
        } catch (adminError) {
            console.error('Firebase Admin Error checking for duplicates:', adminError);
            return NextResponse.json({ error: 'Communication error with authentication backend. Try again.' }, { status: 500 });
        }
        
        // Also check Firestore
        const snapshot = await adminDb.collection('users')
            .where('phone', 'in', [formattedPhone, cleanedPhone, phone])
            .get();
        if (!snapshot.empty) {
            return NextResponse.json({ error: 'An account with this phone number is already registered in our database.' }, { status: 409 });
        }

        // If we get here, user is unique. Create them.
        const userRecord = await adminAuth.createUser({
            email,
            phoneNumber: formattedPhone,
            password, 
            displayName: name,
        });

        // The password hash is handled by Firebase Auth, but the custom schema expects it in Firestore too.
        await adminDb.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            displayName: name.trim(),
            email: email.trim(),
            phone: cleanedPhone, // store without +91 for consistency in Firestore? Actually previous code stored `user.phoneNumber ? user.phoneNumber.replace(/\D/g, '').slice(-10) : ''`
            role: 'customer',
            password: hashedPassword,
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ 
            success: true, 
            uid: userRecord.uid 
        });

    } catch (error: any) {
        console.error('Create User Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}
