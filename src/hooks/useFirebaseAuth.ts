// ============================================================================
// PulseMaker Simulator - Firebase Authentication Hook
// Supports Anonymous Student Logins and Facilitator Email/Google Auth
// ============================================================================

import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // One-click quick login for students (no email or password needed)
  const loginAsStudentAnonymous = async (studentNickname?: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await signInAnonymously(auth);
      if (studentNickname && cred.user) {
        await updateProfile(cred.user, {
          displayName: studentNickname.trim(),
        });
        setUser({ ...cred.user, displayName: studentNickname.trim() });
      }
      return cred.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in anonymously';
      setAuthError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Facilitator / Teacher sign in
  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return cred.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setAuthError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Facilitator / Teacher register
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
        setUser({ ...cred.user, displayName: name });
      }
      return cred.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setAuthError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google sign in
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      return cred.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in cancelled or failed';
      setAuthError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    authError,
    setAuthError,
    loginAsStudentAnonymous,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
  };
}
