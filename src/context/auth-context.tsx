
"use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '@/lib/definitions';
import { onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client'; // Using the client auth instance
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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
             // This can happen during registration before the doc is created.
             // The login function will handle setting the doc.
             console.log("User document not found for authenticated user, may be new registration:", firebaseUser.uid);
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
        // New registration flow
        // In a real app, this would be a secure backend call that returns a custom token
        const mockUid = `user-${Date.now()}`;
        try {
            // NOTE: In a real production app, you would NEVER generate a token on the client.
            // This would be a call to a secure Cloud Function:
            // const response = await fetch('/api/create-user-and-get-token', { method: 'POST', body: JSON.stringify({ uid: mockUid }) });
            // const { token } = await response.json();
            // await signInWithCustomToken(auth, token);
            
            // For this project, we simulate the flow. We can't actually create a real custom token
            // on the client, so we will set the user document first and then rely on onAuthStateChanged
            // after a mock/manual sign-in process.
            
            // The security rules need to allow this initial write.
            const newUser: User = {
                id: mockUid,
                name: nameOrDepartment,
                mobile: mobile,
                avatarUrl: `https://picsum.photos/seed/${nameOrDepartment}/100/100`,
                civicPoints: 0,
            };

            const userRef = doc(db, "users", mockUid);
            // This will now succeed because of the updated security rules
            await setDoc(userRef, { name: newUser.name, mobile: newUser.mobile, avatarUrl: newUser.avatarUrl, civicPoints: newUser.civicPoints });

            // This part is still a mock. A real login flow (e.g. with phone OTP)
            // would properly sign the user in. After that, onAuthStateChanged would fire
            // and load the document we just created.
             setUser({ type: 'user', data: {...newUser, idToken: 'mock-token' }});


        } catch (error) {
            console.error("Error during registration process:", error);
        }

      } else {
        // This is a login for an existing user (mocked with a custom token).
        // This part would involve a backend call to generate a custom token for a given user (e.g., via mobile OTP).
        // For simplicity, we are skipping the actual sign-in with a custom token.
        // The onAuthStateChanged listener handles setting user state for already logged-in users.
      }
    } else if (type === 'admin') {
      setUser({ type: 'admin', data: { name: 'Admin User', email: 'admin@voice2action.com' } });
    } else {
       setUser({ type: 'department', data: { name: 'Dept Head', department: nameOrDepartment || 'Roads & Transport' } });
    }
  };

  const logout = () => {
    // We don't have a real Firebase user session from custom tokens,
    // so we just clear the state. If using real Firebase Auth (like phone),
    // you would call auth.signOut().
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
