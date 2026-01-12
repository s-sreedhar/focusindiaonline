import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Singleton instance
let firebaseAdmin: admin.app.App | null = null;

function getFirebaseAdmin(): admin.app.App {
    if (firebaseAdmin) {
        return firebaseAdmin;
    }

    // Check if already initialized
    if (admin.apps.length > 0) {
        firebaseAdmin = admin.apps[0]!;
        return firebaseAdmin;
    }

    try {
        // Get credentials from environment or construct from individual env vars
        let credential;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            // Use full service account JSON from env
            // console.log('🔥 Admin Init: Using FIREBASE_SERVICE_ACCOUNT_KEY');
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                credential = admin.credential.cert(serviceAccount);
            } catch (parseError: any) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
                throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
            }
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            // Use individual env vars
            // console.log('🔥 Admin Init: Using individual Firebase env vars');
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        } else {
            console.warn('⚠️ Admin Init: No credentials found in env. Returning unauthenticated app or relying on ADC.');
        }

        firebaseAdmin = admin.initializeApp({
            credential,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'focusindiaonline-ea702',
        });

        // console.log('✅ Firebase Admin initialized successfully');
        return firebaseAdmin;
    } catch (error: any) {
        console.error('❌ Firebase Admin initialization failed:', error);
        throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    }
}

// Export initialized services
export function getAdminAuth() {
    const app = getFirebaseAdmin();
    return admin.auth(app);
}

export function getAdminDb() {
    const app = getFirebaseAdmin();
    // Use the named database 'focusindia' to match client configuration
    return getFirestore(app, 'focusindia');
}

export function getAdminStorage() {
    const app = getFirebaseAdmin();
    return admin.storage(app);
}

// Legacy exports - these will initialize on first property access
export const adminAuth = new Proxy({} as admin.auth.Auth, {
    get(target, prop) {
        const auth = getAdminAuth();
        const value = auth[prop as keyof admin.auth.Auth];
        return typeof value === 'function' ? value.bind(auth) : value;
    }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
    get(target, prop) {
        const db = getAdminDb();
        const value = db[prop as keyof admin.firestore.Firestore];
        return typeof value === 'function' ? value.bind(db) : value;
    }
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
    get(target, prop) {
        const storage = getAdminStorage();
        const value = storage[prop as keyof admin.storage.Storage];
        return typeof value === 'function' ? value.bind(storage) : value;
    }
});

export default admin;
