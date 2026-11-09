// ============================================================================
// PulseMaker Simulator - Firebase SDK Configuration & Initialization
// Production-ready with Offline IndexedDB Persistence & Environment Variables
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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB7-DWkHoq1Yms6iIkCR1QEyOHNS1x2eAQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pulsemaker-simulator.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pulsemaker-simulator',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pulsemaker-simulator.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '220201944572',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:220201944572:web:5c895ca0587f752eb05e79',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-20S1P4H4CG',
};

// Singleton App Instance
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance
export const auth: Auth = getAuth(app);

// Firestore Instance with robust Multi-Tab Offline Cache
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // If already initialized or in fallback environments (e.g. strict private browsing)
  firestoreDb = getFirestore(app);
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
      // Analytics not supported or blocked by ad-blocker
    });
}
