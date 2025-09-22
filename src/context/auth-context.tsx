

"use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '@/lib/definitions';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ type: 'guest' });
  
   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            setUser({ type: 'user', data: { ...(userDoc.data() as User), id: firebaseUser.uid, idToken: token } });
        } else {
             console.log("User document not found for authenticated user:", firebaseUser.uid);
             // This can happen if the user is authenticated with Firebase but their doc doesn't exist yet.
             // We can log them out or handle it as a partial login state.
             setUser({ type: 'guest' });
        }
      } else {
        setUser({ type: 'guest' });
      }
    });
    return () => unsubscribe();
  }, []);


  const login = async (type: 'user' | 'admin' | 'department', nameOrDepartment?: string, mobile?: string) => {
    if (type === 'user') {
      if (nameOrDepartment && mobile) {
        // New user registration
        // For a prototype, we create a mock user ID. In a real app, this comes from Firebase Auth.
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
            // This write will succeed because the security rule is `allow create: if true;`
            const userRef = doc(db, "users", mockUid);
            await setDoc(userRef, { 
                name: newUser.name, 
                mobile: newUser.mobile, 
                avatarUrl: newUser.avatarUrl, 
                civicPoints: newUser.civicPoints 
            });

            // Set the user state locally. onAuthStateChanged will handle it from now on.
            setUser({ type: 'user', data: newUser });

        } catch (error) {
            console.error("Error creating user document:", error);
        }
      } else {
          // Existing user login
          // We can't actually log in via phone/OTP on the client without a full backend.
          // So we'll set a mock user. In a real app, you'd get the user from Firebase Auth.
          setUser({ type: 'user', data: {
              id: 'user-mock-login',
              name: "Logged-in User",
              mobile: "9876543210",
              civicPoints: 100,
              avatarUrl: 'https://picsum.photos/seed/mock-user/100/100',
              idToken: 'mock-token-for-dev'
          }});
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

  const value = useMemo(() => ({ user, login, logout, updateUser, incrementCivicPoints }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
