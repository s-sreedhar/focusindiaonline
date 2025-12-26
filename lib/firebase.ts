import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, setLogLevel, Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    try {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache()
      }, "focusindia");
    } catch (e) {
      // console.warn("Firestore initialize error, falling back to getFirestore:", e);
      db = getFirestore(app, "focusindia");
    }
  } catch (error) {
    //console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase API key missing. Firebase not initialized.");
}

if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}

export { app, auth, db };
