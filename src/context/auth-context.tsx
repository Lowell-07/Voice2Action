

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
  login: (type: 'user' | 'admin' | 'department', name?: string, mobile?: string, existingUser?: User) => void;
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
            const idToken = await firebaseUser.getIdToken();
            const userData = { ...(userDoc.data() as User), id: firebaseUser.uid, idToken };
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
    
    try {
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          return { exists: true, user: { id: userDoc.id, ...userDoc.data() } as User };
      }
      return { exists: false };
    } catch (error) {
      console.error("Permission error checking user:", error);
      // This will now fail gracefully on the client if rules aren't set,
      // instead of throwing an unhandled error.
      // The user will be guided to register.
      return { exists: false };
    }
  };

  const login = async (type: 'user' | 'admin' | 'department', name?: string, mobile?: string, existingUser?: User) => {
    if (type === 'user') {
      let userToLogin = existingUser;
      
      if (!existingUser && name && mobile) { // Registering a new user
        const mockUid = `user-${Date.now()}`;
        const newUser: User = {
            id: mockUid,
            name: name,
            mobile: mobile,
            avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
            civicPoints: 0,
            idToken: 'mock-token-for-dev'
        };

        try {
            const userRef = doc(db, "users", mockUid);
            // This setDoc is what requires the correct security rule
            await setDoc(userRef, { 
                name: newUser.name, 
                mobile: newUser.mobile, 
                avatarUrl: newUser.avatarUrl, 
                civicPoints: newUser.civicPoints 
            });
            userToLogin = newUser;
        } catch (error) {
            console.error("Error creating user document:", error);
            return;
        }
      }

      if (userToLogin) {
         // This is a mock sign-in for the prototype.
         // In a real app, you'd get a custom token from a backend.
         if (auth) {
            try {
                // To make the client aware of an "authenticated" state, we'll set it directly.
                // The onAuthStateChanged listener will then pick up the new state.
                setUser({ type: 'user', data: userToLogin });
            } catch (e) {
                console.error("Mock sign in failed", e);
            }
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
