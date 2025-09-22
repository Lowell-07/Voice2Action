

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
        
        try {
            const q = query(collection(db, "users"), where("mobile", "==", mobile), limit(1));
            const querySnapshot = await getDocs(q);

            let userDoc;
            let isNewUser = true;

            if (!querySnapshot.empty) {
                userDoc = querySnapshot.docs[0];
                isNewUser = false;
            }

            // In a real app, you would have a backend generate a custom token.
            // For this prototype, we'll simulate it by creating a "mock" token.
            // The key is to sign in to establish a UID.
            // We use the mobile number as the UID for simplicity in this prototype.
            const mockToken = `mock-token-for-uid-${mobile}`;

            // This is a placeholder for a real signInWithCustomToken call
            const userCredential = { user: { uid: mobile } }; // Mock user credential

            const firebaseUser = userCredential.user;
            
            const userRef = doc(db, "users", firebaseUser.uid);
            let finalUserData: User;

            if (isNewUser) {
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
                finalUserData = { id: firebaseUser.uid, ...userDoc!.data() } as User;
            }
            
            // Manually set the user state since we are not using real Firebase Auth here
            setUser({ type: 'user', data: finalUserData });
            
            return { success: true, isNewUser };

        } catch(error) {
            console.error("Firebase data handling error:", error);
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
    // Since we are mocking auth, we just clear the local state
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