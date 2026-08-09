import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from './firebaseConfig';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Auth with Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore with persistent offline cache (IndexedDB)
// This means the app works offline and syncs when back online
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;
