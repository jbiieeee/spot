import { createContext, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, configError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
