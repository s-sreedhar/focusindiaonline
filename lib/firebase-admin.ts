import * as admin from 'firebase-admin';

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
            console.log('Using FIREBASE_SERVICE_ACCOUNT_KEY from environment');
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                credential = admin.credential.cert(serviceAccount);
            } catch (parseError: any) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
                throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
            }
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            // Use individual env vars
            console.log('Using individual Firebase env vars');
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        } else {
            // Fallback: construct from the JSON file data directly
            // This is for development only - in production use environment variables
            console.log('Using hardcoded fallback credentials (development only)');
            credential = admin.credential.cert({
                projectId: 'focusindiaonline-ea702',
                clientEmail: 'firebase-adminsdk-fbsvc@focusindiaonline-ea702.iam.gserviceaccount.com',
                privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkKqNTOTgsbQB4\ndZV+HTHYZEOrDGeaoeRg10D4zkr0Q4+C7e2CyCVRtpw0b4IJyYaANCPRYb4ZSBvZ\n8BmKdr04YnF7w9G7HQQovHd/gqjfDoKd1YsjoHVdhmkhbejvF+kaXWxKTVQZFhsJ\n0KMghqNCUFr2YTxcWZJKOJsYgQsdae7G7M0uCihm475Bq5z+2zwH15oYs07+1hPv\n+un1FZRawd5mxDzbYFqevNZ+aRnZYDsgyazJsKiqkgEbOzncWGIXrT62g2jtYMUB\nhYh/wFYTeIdNaDcbHsfG/nrW0nadvFQ6m/xIRH0lb5O/mDaEvH1K7wGnodP2wpfE\ngJMVy/W/AgMBAAECggEAJeKBFm+Z+wacmS/pc9Ug76MTyqFuN00s+vwxzjktKvl8\nYOavbQLrOdQ+cAtbow6Sr3tY2LUJvaPaaYzzF/UW7bAqKDmkaN3lW9FCcnagqfkb\nQ3lIRsx8yTx/fmty2dpWvPLaTrtRsQhc7QLs4lCv1Fne5ATEfTteeypdAGanPf4Z\nVKxgzEu2tkQMWNsKMWcJqF2LJ8RmDBd4KIm6yWSJTopsU3A4WtkMsIFJNPBjtSiD\n9CQEXfCuTab1AWY45iR4DSGGpT1ZxYaCr6ja+kxTT4t4C6dWJvqVRq8YmcYFVKvR\n3Pa9p7iYTBlXy3yLM65qU+fAbnjyty9o/7ujwoieIQKBgQDfy9cja9M0gOqDpAn6\nARN4dRTGIeL6OmgRluDlGdaEvCobF0RZjSjHsnReWgVeNYbvW1bmjyo+i7gDXL2J\nIilPtKk6FB5lT6nVIPfQ6om4E3tfpCUo54DjlTrC1lC8P6eepOkNbT1xAOXGpq01\nITWYdO4UovuyeqRI7QDe2NQiIwKBgQC7yivYmbec3IP751/oyiqzIW7hJRCwkdOz\nZtBu1SoGsqN+08oqezfrl8BZbuhteuHgPdTw2dJgq3Uha214L5CIX3feVUbEDup1\nW8m6gjMRtp1970gJBEbzitxO+UkSi0onqGA37/qFdjuZ9uxhu2IYUliZxMcm1Nii\naBwu9D6RtQKBgF5ZBEj1kyPmWXfH90DDpV66FVj2Pkd5yhfoQMW1H9/zp9il9XW/\ncfrGfBKu5uZxsIJGQpuOraOSqbAZL/qZQUtOAa3vf2T8sb+dV3xm9Ep7RB7tB5F4\nD7liV1R+n6jNOTBDm9DCRg3W8AfQiuMELiEo4pomn+/9jjcEW8KXLM97AoGADIEt\n4kJ6I4vbjg6eKFYt+bekNoHNVrSfMDcMchTns4J5uJxJvgJuetWkDVCBUaj5GYGE\niHU4uQ8xwYPxyisAqNQSm096YtvLaP0vtaet1uQeIKCqX09VmioI+YlIAGAeE/32\nSkNEn1Z8KYhzvR5JLe1t0O91g3Rw6H+eQNIqyHECgYBVY6gxhFGFqYHFF67ZZ6WP\n7ioxagvcxCF+5mhRcpbSeWmq0iQFJ/15c9TcRM4rx+E3n+XfAAlf0SlljL3mIehS\ndfQ7jLmKgNNQw7tOV3Q72mGcX00h6qjS1nRoq11Xh+/bb5ytdmxmyGOTjoTz7/5/\n0gy3rgi/REID5j1uUyzeMA==\n-----END PRIVATE KEY-----\n',
            });
        }

        firebaseAdmin = admin.initializeApp({
            credential,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'focusindiaonline-ea702',
        });

        console.log('✅ Firebase Admin initialized successfully');
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
    return admin.firestore(app);
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
