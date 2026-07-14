import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || '',
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FB_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FB_STORAGE || '',
  messagingSenderId: import.meta.env.VITE_FB_SENDER || '',
  appId: import.meta.env.VITE_FB_APP_ID || '',
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID || ''
};

export const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId
].every(Boolean);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const storage = getStorage(app);
export const analyticsPromise = isAnalyticsSupported()
  .then((supported) => (supported && firebaseConfig.measurementId ? getAnalytics(app) : null))
  .catch(() => null);
