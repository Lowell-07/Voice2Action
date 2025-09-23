
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
  login: (mobileOrUsername: string, password?: string) => Promise<{success: boolean, error?: string}>;
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
  const [user, setUser] = useState<AuthUser>({ type: 'guest' });

   const login = async (identifier: string, department?: string): Promise<{success: boolean, error?: string}> => {
    // Admin login
    if (identifier === 'lowell' && department === 'lowell') {
        const adminData = { name: 'Lowell', email: 'admin@voice2action.com' };
        setUser({ type: 'admin', data: adminData });
        return { success: true };
    }
    // Department login
    if (department) {
        setUser({ type: 'department', data: { name: department, department: department } });
        return { success: true };
    }
    
    // User login
    const mobile = identifier;
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("mobile", "==", mobile));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'Account not found. Please register.' };
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        
        setUser({ type: 'user', data: userData });

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

        const newUser: Omit<User, 'id'> = {
          name: name,
          mobile: mobile,
          avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
          civicPoints: 0,
        };
        
        // The document ID will be the mobile number for simplicity in this prototype
        const userRef = doc(db, "users", mobile);
        await setDoc(userRef, newUser);
        
        const fullUser: User = { ...newUser, id: mobile };
        setUser({ type: 'user', data: fullUser });
      
        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during registration.";
        return { success: false, error: errorMessage };
    }
  };
  
  const logout = async () => {
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
