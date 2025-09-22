

"use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '@/lib/definitions';
import { onAuthStateChanged } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const idToken = await firebaseUser.getIdToken();
            const userData = { ...(userDoc.data() as User), id: firebaseUser.uid, idToken };
            setUser({ type: 'user', data: userData });
        } else {
             console.log("User document not found for authenticated user:", firebaseUser.uid);
             // This case happens if a user is created but the doc write fails. We log them out.
             auth.signOut();
             setUser({ type: 'guest' });
        }
      } else {
        setUser({ type: 'guest' });
      }
    });
    return () => unsubscribe();
  }, []);
  
  const login = async (type: 'user' | 'admin' | 'department', name?: string, mobile?: string): Promise<{success: boolean, isNewUser?: boolean, error?: string}> => {
    if (type === 'user') {
        if (!mobile) return { success: false, error: 'Mobile number is required.' };
        
        // This is a mock server call to get a custom token for the given mobile number.
        // In a real app, this would hit your backend, which would verify the user,
        // create one if needed, and generate a real Firebase custom token.
        const response = await fetch(`https://us-central1-genkit-llm-demo.cloudfunctions.net/getCustomToken?uid=${mobile}`);
        if (!response.ok) {
            return { success: false, error: 'Failed to authenticate with the server.' };
        }
        const { token } = await response.json();
        
        try {
            // Sign in with the custom token
            const userCredential = await auth.signInWithCustomToken(auth, token);
            const firebaseUser = userCredential.user;
            
            const userRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userRef);
            
            let isNewUser = false;
            let finalUserData: User;

            if (!userDoc.exists()) {
                // User does not exist, so this is a registration
                isNewUser = true;
                if (!name) return { success: false, error: 'Name is required for registration.' };

                const newUser: Omit<User, 'id' | 'idToken'> = {
                    name: name,
                    mobile: mobile,
                    avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
                    civicPoints: 0,
                };
                await setDoc(userRef, newUser);
                finalUserData = { ...newUser, id: firebaseUser.uid };

            } else {
                // User exists, this is a login
                finalUserData = { id: firebaseUser.uid, ...userDoc.data() } as User;
            }
            
            // The onAuthStateChanged listener will handle setting the user state
            // but we return success here to complete the login flow on the page.
            return { success: true, isNewUser };

        } catch(error) {
            console.error("Firebase sign-in or data handling error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
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

