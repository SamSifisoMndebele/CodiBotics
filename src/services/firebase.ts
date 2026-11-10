// ============================================================================
// CodiBotics Simulator - Firebase SDK Configuration & Initialization
// ============================================================================

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Public Firebase Web Configuration (CodiBotics)
const firebaseConfig = {
  apiKey: 'AIzaSyDInjDWjU1f0GEu5798ZmG4J_kUybdjASA',
  authDomain: 'codibotics.firebaseapp.com',
  projectId: 'codibotics',
  storageBucket: 'codibotics.firebasestorage.app',
  messagingSenderId: '1016315955864',
  appId: '1:1016315955864:web:5f56f370714fce1883deed',
  measurementId: 'G-YHQW5MX29B',
};

// Singleton App Instance
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance
export const auth: Auth = getAuth(app);

// Firestore Instance with Multi-Tab Offline Cache (using named database 'default')
const DATABASE_ID = 'default';

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    DATABASE_ID
  );
} catch {
  firestoreDb = getFirestore(app, DATABASE_ID);
}

export const db: Firestore = firestoreDb;

// Optional Analytics (Non-blocking)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported or blocked
    });
}
