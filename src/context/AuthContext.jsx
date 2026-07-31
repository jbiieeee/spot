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
const LOCAL_AUTH_KEY = 'spot.local.session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const configError = hasFirebaseConfig ? '' : 'Firebase configuration missing in .env. Running with local authentication.';

  useEffect(() => {
    if (hasFirebaseConfig && auth) {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          try {
            if (db) {
              const snap = await getDoc(doc(db, 'users', u.uid));
              setProfile(snap.exists() ? { id: u.uid, ...snap.data() } : { id: u.uid, role: 'supervisor', name: u.displayName || u.email, agency: 'S.P.O.T Command HQ', phone: '' });
            } else {
              setProfile({ id: u.uid, role: 'supervisor', name: u.displayName || u.email, agency: 'S.P.O.T Command HQ', phone: '' });
            }
          } catch {
            setProfile({ id: u.uid, role: 'supervisor', name: u.displayName || u.email, agency: 'S.P.O.T Command HQ', phone: '' });
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return () => unsub();
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_AUTH_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setProfile(parsed.profile);
        }
      } catch {
        // invalid session
      }
      setLoading(false);
    }
  }, []);

  const login = async (email, password, rememberDevice = false) => {
    const trimmedEmail = email?.trim();
    if (!trimmedEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    if (hasFirebaseConfig && auth) {
      await setPersistence(auth, rememberDevice ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
    } else {
      const uid = `local-${Date.now()}`;
      const sessionUser = { uid, email: trimmedEmail };
      const sessionProfile = {
        id: uid,
        name: trimmedEmail.split('@')[0].toUpperCase(),
        email: trimmedEmail,
        role: 'Supervisor Command Officer',
        agency: 'S.P.O.T Command HQ',
        phone: '+63 917 555 0100'
      };

      setUser(sessionUser);
      setProfile(sessionProfile);

      if (rememberDevice) {
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: sessionUser, profile: sessionProfile }));
      }
    }
  };

  const logout = async () => {
    if (hasFirebaseConfig && auth) {
      await signOut(auth);
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUser(null);
    setProfile(null);
  };

  const updateAccountProfile = async ({ name, role, agency, phone }) => {
    if (!user) throw new Error('No active user session.');
    const trimmedName = name?.trim();
    if (!trimmedName) throw new Error('Display name is required.');

    const patch = {
      name: trimmedName,
      role: role || profile?.role || 'supervisor',
      agency: agency || profile?.agency || 'S.P.O.T Command HQ',
      phone: phone || profile?.phone || ''
    };

    if (hasFirebaseConfig && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'users', user.uid), patch);
        await updateProfile(auth.currentUser, { displayName: trimmedName });
      } catch (err) {
        console.warn('Firestore profile update notice:', err);
      }
    }

    const updatedProfile = { ...(profile || {}), id: user.uid, ...patch };
    setProfile(updatedProfile);
    if (!hasFirebaseConfig) {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user, profile: updatedProfile }));
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!user?.email) throw new Error('No active user session.');
    if (!currentPassword || !newPassword) throw new Error('Current and new password are required.');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');

    if (hasFirebaseConfig && auth?.currentUser) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
        updateAccountProfile,
        changePassword,
        configError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
