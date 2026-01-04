import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Missing Firebase Admin credentials in environment variables.');
}

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let adminAppInit;
try {
    adminAppInit = getApps().find((it) => it.name === 'firebase-admin-app') ||
        initializeApp(
            {
                credential: cert(serviceAccount),
            },
            'firebase-admin-app'
        );
} catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    adminAppInit = null;
}

export const adminApp = adminAppInit;
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp, 'focusindia') : null;
