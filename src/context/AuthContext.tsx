import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onIdTokenChanged, User as FirebaseUser, getAdditionalUserInfo } from 'firebase/auth';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: any | null;
  idToken: string | null;
  role: 'admin' | 'customer' | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  isNewUserSession: boolean;
  clearNewUserSession: () => void;
  updateDbUser: (data: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  idToken: null,
  role: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
  isNewUserSession: false,
  clearNewUserSession: () => {},
  updateDbUser: () => {},
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUserSession, setIsNewUserSession] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Force refresh to handle expired cached tokens immediately on app load, 
        // subsequent auto-refreshes will trigger this listener naturally.
        const token = await currentUser.getIdToken();
        setIdToken(token);
        
        try {
          const res = await fetch('/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setRole(data.role);
            setDbUser(data);
          } else {
            setRole(null);
            setDbUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setRole(null);
          setDbUser(null);
        }
      } else {
        setIdToken(null);
        setRole(null);
        setDbUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const isNew = getAdditionalUserInfo(result)?.isNewUser || false;
      if (isNew) {
        setIsNewUserSession(true);
      }
      
      const firstName = result.user.displayName ? result.user.displayName.split(' ')[0] : 'there';
      if (isNew) {
        addToast(`Welcome to Camp New Burger, ${firstName}! 🍔`, "success");
      } else {
        addToast(`Welcome back, ${firstName}! 🍔`, "success");
      }
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or cancelled the Google Sign-in popup; no error notification needed
        return;
      }
      console.error("Error signing in:", error);
      if (typeof addToast === 'function') {
        addToast("Failed to sign in. Please try again.", "error");
      }
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setIsNewUserSession(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const clearNewUserSession = () => setIsNewUserSession(false);
  const updateDbUser = (data: any) => setDbUser((prev: any) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, dbUser, idToken, role, loading, signIn, logOut, isNewUserSession, clearNewUserSession, updateDbUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
