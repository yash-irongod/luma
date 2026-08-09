import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result (mobile sign-in flow)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('[Auth] Redirect sign-in successful:', result.user.email);
        }
      })
      .catch((err) => {
        console.error('[Auth] Redirect result error:', err.code, err.message);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[Auth] State changed:', firebaseUser?.email || 'signed out');
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Try popup first (works on most browsers)
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[Auth] Popup sign-in successful:', result.user.email);
      return result.user;
    } catch (popupError) {
      console.warn('[Auth] Popup failed:', popupError.code);

      // If popup was blocked or failed, try redirect
      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.code === 'auth/popup-closed-by-user' ||
        popupError.code === 'auth/cancelled-popup-request'
      ) {
        try {
          console.log('[Auth] Falling back to redirect...');
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('[Auth] Redirect also failed:', redirectError.code, redirectError.message);
          throw redirectError;
        }
      } else {
        throw popupError;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      console.log('[Auth] Signed out');
    } catch (error) {
      console.error('[Auth] Sign-out error:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
