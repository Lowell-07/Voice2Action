

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
  login: (type: 'user' | 'admin' | 'department', nameOrDepartment?: string, mobile?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  incrementCivicPoints: (userId: string, points: number) => void;
  checkUserExists: (mobile: string) => Promise<{ exists: boolean, user?: User }>;
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
            const userData = { ...(userDoc.data() as User), id: firebaseUser.uid, idToken: await firebaseUser.getIdToken() };
            setUser({ type: 'user', data: userData });
        } else {
             console.log("User document not found for authenticated user:", firebaseUser.uid);
             setUser({ type: 'guest' });
        }
      } else {
        setUser({ type: 'guest' });
      }
    });
    return () => unsubscribe();
  }, []);

  const checkUserExists = async (mobile: string): Promise<{ exists: boolean, user?: User }> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("mobile", "==", mobile), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { exists: true, user: { id: userDoc.id, ...userDoc.data() } as User };
    }
    return { exists: false };
  };

  const login = async (type: 'user' | 'admin' | 'department', nameOrDepartment?: string, mobile?: string, existingUser?: User) => {
    if (type === 'user') {
        if (existingUser) { // Logging in an existing user
            // In a real app, this would involve Firebase Auth to sign in the user
            // For this prototype, we'll set the user state directly
            setUser({ type: 'user', data: existingUser });

        } else if (nameOrDepartment && mobile) { // Registering a new user
            const mockUid = `user-${Date.now()}`;
            const newUser: User = {
                id: mockUid,
                name: nameOrDepartment,
                mobile: mobile,
                avatarUrl: `https://picsum.photos/seed/${nameOrDepartment}/100/100`,
                civicPoints: 0,
                idToken: 'mock-token-for-dev'
            };

            try {
                const userRef = doc(db, "users", mockUid);
                await setDoc(userRef, { 
                    name: newUser.name, 
                    mobile: newUser.mobile, 
                    avatarUrl: newUser.avatarUrl, 
                    civicPoints: newUser.civicPoints 
                });
                setUser({ type: 'user', data: newUser });
            } catch (error) {
                console.error("Error creating user document:", error);
            }
        }
        
    } else if (type === 'admin') {
      setUser({ type: 'admin', data: { name: 'Admin User', email: 'admin@voice2action.com' } });
    } else if (type === 'department') {
       setUser({ type: 'department', data: { name: 'Dept Head', department: nameOrDepartment || 'Roads & Transport' } });
    }
  };

  const logout = () => {
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

  const value = useMemo(() => ({ user, login, logout, updateUser, incrementCivicPoints, checkUserExists }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
