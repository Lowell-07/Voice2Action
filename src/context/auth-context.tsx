
"use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '@/lib/definitions';
import { mockUsers } from '@/lib/data';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-client'; // Using the client auth instance

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
  // Note: In a real app, users would be fetched from a database.
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);
  
  // This effect will run on the client and attach an auth state listener.
  // It also gets the ID token when the user logs in.
   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        // In a real app, you'd fetch the user profile from your database using the UID
        const existingUser = allUsers.find(u => u.id === firebaseUser.uid);
        if (existingUser) {
            setUser({ type: 'user', data: {...existingUser, idToken: token} });
        }
      } else {
        setUser({ type: 'guest' });
      }
    });
    return () => unsubscribe();
  }, [allUsers]);


  const login = async (type: 'user' | 'admin' | 'department', nameOrDepartment?: string, mobile?: string) => {
    // This is a simplified mock login flow. In a real app, you would have a backend
    // that creates a custom token for a given user ID, and you would sign in with that.
    // For now, we'll just mock the user object creation.
    if (type === 'user') {
       if (nameOrDepartment && mobile) {
        // This is a new registration
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: nameOrDepartment,
          mobile: mobile,
          avatarUrl: `https://picsum.photos/seed/${nameOrDepartment}/100/100`,
          civicPoints: 0,
          idToken: 'mock-token-for-new-user' // Mock token
        };
        setUser({ type: 'user', data: newUser });
        setAllUsers(prev => [...prev, newUser]);
      } else {
        // This is a login for an existing user (mocked)
        const mockLoggedInUser = { ...allUsers[0], idToken: 'mock-token-for-existing-user'};
        setUser({ type: 'user', data: mockLoggedInUser });
      }
    } else if (type === 'admin') {
      setUser({ type: 'admin', data: { name: 'Admin User', email: 'admin@voice2action.com' } });
    } else {
       setUser({ type: 'department', data: { name: 'Dept Head', department: nameOrDepartment || 'Roads & Transport' } });
    }
  };

  const logout = () => {
    auth.signOut();
    setUser({ type: 'guest' });
  };
  
  const updateUser = (updates: Partial<User>) => {
    if (user.type === 'user') {
        const updatedUserData = { ...user.data, ...updates };
        setUser({
            ...user,
            data: updatedUserData
        });
        setAllUsers(prev => prev.map(u => u.id === user.data.id ? updatedUserData : u));
    }
  };
  
  const incrementCivicPoints = (userId: string, points: number) => {
      setAllUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, civicPoints: (u.civicPoints || 0) + points } : u
      ));
      if (user.type === 'user' && user.data.id === userId) {
          setUser(prevUser => {
              const currentData = (prevUser as {type: 'user', data: User}).data;
              return {
              ...prevUser,
              data: {
                  ...currentData,
                  civicPoints: (currentData. civicPoints || 0) + points
              }
          }});
      }
  };

  const value = useMemo(() => ({ user, login, logout, updateUser, incrementCivicPoints }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
