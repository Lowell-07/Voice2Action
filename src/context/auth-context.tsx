

"use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '@/lib/definitions';
import { onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

type AuthUser =
  | { type: 'guest' }
  | { type: 'user'; data: User }
  | { type: 'admin'; data: { name: string; email: string } }
  | { type: 'department'; data: { name: string; department: string } };

type AuthContextType = {
  user: AuthUser;
  login: (type: 'user' | 'admin' | 'department', name?: string, mobile?: string) => Promise<{success: boolean, isNewUser?: boolean, error?: string}>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  incrementCivicPoints: (userId: string, points: number) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ type: 'guest' });
  
   useEffect(() => {
    // In a real app with real Firebase Auth, this listener is crucial.
    // For our current prototype, its role is diminished, but we keep it for structure.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // This part is less likely to be hit with our simplified login,
        // but it's good practice for when real auth is added.
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = { ...(userDoc.data() as User), id: firebaseUser.uid };
            setUser({ type: 'user', data: userData });
        }
      } else {
        // When auth.signOut() is called, this will correctly reset the user to guest.
        setUser({ type: 'guest' });
      }
    });
    return () => unsubscribe();
  }, []);
  
  const login = async (type: 'user' | 'admin' | 'department', name?: string, mobile?: string): Promise<{success: boolean, isNewUser?: boolean, error?: string}> => {
    if (type === 'user') {
        if (!mobile) return { success: false, error: 'Mobile number is required.' };
        
        try {
            const userRef = doc(db, "users", mobile); // Use mobile as the document ID
            const userDoc = await getDoc(userRef);
            const isNewUser = !userDoc.exists();

            if (isNewUser) {
                if (!name) {
                    return { success: false, error: 'Name is required for registration.' };
                }
                const newUser: Omit<User, 'id'> = {
                    name: name,
                    mobile: mobile,
                    avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
                    civicPoints: 0,
                };
                // For a new user, create their document in Firestore.
                await setDoc(userRef, newUser);
                setUser({ type: 'user', data: { ...newUser, id: mobile }});
            } else {
                // For an existing user, just set the user state.
                setUser({ type: 'user', data: { id: mobile, ...userDoc.data() } as User});
            }
            
            return { success: true, isNewUser };

        } catch(error) {
            console.error("Firestore data handling error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during login.";
            return { success: false, error: errorMessage };
        }
        
    } else if (type === 'admin') {
      setUser({ type: 'admin', data: { name: 'Admin User', email: 'admin@voice2action.com' } });
       return { success: true };
    } else if (type === 'department' && name) {
       setUser({ type: 'department', data: { name: 'Dept Head', department: name } });
       return { success: true };
    }
    return { success: false, error: 'Invalid login type.' };
  };

  const logout = () => {
    // For our simulated auth, we just clear the local state.
    // auth.signOut() is called to ensure consistency if we ever switch to real auth.
    auth.signOut();
    setUser({ type: 'guest' });
  };
  
  const updateUser = async (updates: Partial<User>) => {
    if (user.type === 'user') {
        const userRef = doc(db, "users", user.data.id);
        const updatedUserData = { ...user.data, ...updates };
        try {
            await setDoc(userRef, updates, { merge: true });
            setUser({
                ...user,
                data: updatedUserData
            });
        } catch (error) {
            console.error("Error updating user document:", error);
        }
    }
  };
  
  const incrementCivicPoints = async (userId: string, points: number) => {
      if (user.type === 'user' && user.data.id === userId) {
          const userRef = doc(db, "users", userId);
          try {
            const newPoints = (user.data.civicPoints || 0) + points;
            await setDoc(userRef, { civicPoints: newPoints }, { merge: true });
            setUser(prev => ({ ...prev, data: { ...user.data, civicPoints: newPoints } } as AuthUser));
          } catch(error) {
            console.error("Error incrementing civic points:", error);
          }
      }
  };

  const value = useMemo(() => ({ user, login, logout, updateUser, incrementCivicPoints }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
