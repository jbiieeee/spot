import { createContext, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, hasFirebaseConfig } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const configError = hasFirebaseConfig ? '' : 'Firebase configuration is required before sign-in is available.';

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setLoading(false);
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          setProfile(snap.exists() ? { id: u.uid, ...snap.data() } : { id: u.uid, role: 'supervisor', name: u.email });
        } catch {
          setProfile({ id: u.uid, role: 'supervisor', name: u.email });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async (email, password, rememberDevice = false) => {
    if (!hasFirebaseConfig) {
      throw new Error(configError);
    }
    await setPersistence(auth, rememberDevice ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateAccountProfile = async ({ name }) => {
    if (!user) throw new Error('No active user session.');
    const trimmedName = name?.trim();
    if (!trimmedName) throw new Error('Display name is required.');

    await updateDoc(doc(db, 'users', user.uid), { name: trimmedName });
    await updateProfile(user, { displayName: trimmedName });
    setProfile((current) => ({ ...(current || {}), id: user.uid, name: trimmedName }));
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!user?.email) throw new Error('No active user session.');
    if (!currentPassword || !newPassword) throw new Error('Current and new password are required.');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateAccountProfile, changePassword, configError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
