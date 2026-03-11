import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        const { identifier } = await req.json();

        if (!identifier) {
            return NextResponse.json({ error: 'Identifier (Email or Phone) is required' }, { status: 400 });
        }

        let userRecord = null;
        let isEmail = identifier.includes('@');

        try {
            if (isEmail) {
                userRecord = await adminAuth.getUserByEmail(identifier);
            } else {
                // Formatting for phone checks
                const digits = identifier.replace(/\D/g, '');
                const last10 = digits.slice(-10);
                const formattedOptions = [`+91${last10}`, last10, digits];
                
                // Try Firebase Auth lookup
                for (const phone of formattedOptions) {
                    try {
                        userRecord = await adminAuth.getUserByPhoneNumber(phone);
                        if (userRecord) break;
                    } catch (e) { /* ignore single not-found errors */ }
                }

                // If not found in Auth by phone, do a deep check in Firestore
                if (!userRecord) {
                    const snapshot = await adminDb.collection('users').where('phone', 'in', formattedOptions).get();
                    if (!snapshot.empty) {
                         const userDoc = snapshot.docs[0];
                         return NextResponse.json({
                             exists: true,
                             user: {
                                 ...userDoc.data(),
                                 uid: userDoc.id,
                             }
                         });
                    }
                }
            }
        } catch (authErr: any) {
            // Handled missing records cleanly below 
        }

        if (!userRecord) {
             // Fallback to checking firestore directly if auth API fails
             if (isEmail) {
                 const snapshot = await adminDb.collection('users').where('email', '==', identifier).limit(1).get();
                 if (!snapshot.empty) {
                     const userDoc = snapshot.docs[0];
                     return NextResponse.json({ exists: true, user: { ...userDoc.data(), uid: userDoc.id } });
                 }
             }
             return NextResponse.json({ exists: false }, { status: 404 });
        }

        // Fetch remaining attributes from Firestore and return
        const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
        if (userDoc.exists) {
            return NextResponse.json({
                exists: true,
                user: {
                    ...userDoc.data(),
                    uid: userRecord.uid,
                }
            });
        }

        // Edge case: user exists in auth but not firestore.
        return NextResponse.json({
            exists: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                phone: userRecord.phoneNumber,
            }
        });

    } catch (error) {
        console.error('Error checking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
