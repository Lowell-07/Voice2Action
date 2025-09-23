
"use client";

import { createContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { User } from '@/lib/definitions';
import { onAuthStateChanged, signInWithCustomToken, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { doc, setDoc, getDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';

type AuthUser =
  | { type: 'guest' }
  | { type: 'loading' }
  | { type: 'user'; data: User }
  | { type: 'admin'; data: { name: string; email: string } }
  | { type: 'department'; data: { name: string; department: string } };

type AuthContextType = {
  user: AuthUser;
  login: (mobile: string) => Promise<{success: boolean, error?: string}>;
  register: (name: string, mobile: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  incrementCivicPoints: (userId: string, points: number) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Helper function to check if user exists
async function checkUserExists(mobile: string): Promise<boolean> {
    const usersQuery = query(collection(db, 'users'), where('mobile', '==', mobile));
    const querySnapshot = await getDocs(usersQuery);
    return !querySnapshot.empty;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ type: 'loading' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const idToken = await firebaseUser.getIdToken();
          const userData = { ...(userDoc.data() as Omit<User, 'id'>), id: firebaseUser.uid, idToken };
          setUser({ type: 'user', data: userData });
        } else {
          await signOut(auth);
          setUser({ type: 'guest' });
        }
      } else {
        setUser({ type: 'guest' });
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (mobile: string): Promise<{success: boolean, error?: string}> => {
    try {
        const userExists = await checkUserExists(mobile);
        if (!userExists) {
            return { success: false, error: 'Account not found. Please register.' };
        }

        const response = await fetch(`https://us-central1-genkit-llm-demo.cloudfunctions.net/getCustomToken?uid=${mobile}`);
        if (!response.ok) {
            throw new Error('Failed to get a mock authentication token from the server.');
        }
        const { token } = await response.json();
      
        const userCredential = await signInWithCustomToken(auth, token);
        // Auth state change will be handled by the onAuthStateChanged listener
        return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during login.";
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name: string, mobile: string): Promise<{success: boolean, error?: string}> => {
    try {
        const userExists = await checkUserExists(mobile);
        if (userExists) {
            return { success: false, error: 'An account with this mobile number already exists. Please log in.' };
        }

        const response = await fetch(`https://us-central1-genkit-llm-demo.cloudfunctions.net/getCustomToken?uid=${mobile}`);
        if (!response.ok) {
            throw new Error('Failed to get a mock authentication token from the server.');
        }
        const { token } = await response.json();
      
        const userCredential = await signInWithCustomToken(auth, token);
        const firebaseUser = userCredential.user;

        const newUser: User = {
          id: firebaseUser.uid,
          name: name,
          mobile: mobile,
          avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
          civicPoints: 0,
        };
        
        await setDoc(doc(db, "users", firebaseUser.uid), {
            name: newUser.name,
            mobile: newUser.mobile,
            avatarUrl: newUser.avatarUrl,
            civicPoints: newUser.civicPoints,
        });

        setUser({ type: 'user', data: newUser });
      
        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during registration.";
        return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    await signOut(auth);
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

  const value = useMemo(() => ({ user, login, register, logout, updateUser, incrementCivicPoints }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
