// ============================================================================
// PulseMaker Simulator - Firebase SDK Configuration & Initialization
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

// Public Firebase Web Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB7-DWkHoq1Yms6iIkCR1QEyOHNS1x2eAQ',
  authDomain: 'pulsemaker-simulator.firebaseapp.com',
  projectId: 'pulsemaker-simulator',
  storageBucket: 'pulsemaker-simulator.firebasestorage.app',
  messagingSenderId: '220201944572',
  appId: '1:220201944572:web:5c895ca0587f752eb05e79',
  measurementId: 'G-20S1P4H4CG',
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
