
"use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '@/lib/definitions';
import { onAuthStateChanged, signInWithCustomToken, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { doc, setDoc, getDoc, serverTimestamp, getFirestore, collection, addDoc, updateDoc, increment, query, onSnapshot, getDocs, deleteDoc } from 'firebase/firestore';

type AuthUser =
  | { type: 'guest' }
  | { type: 'loading' }
  | { type: 'user'; data: User }
  | { type: 'admin'; data: { name: string; email: string } }
  | { type: 'department'; data: { name: string; department: string } };

type AuthContextType = {
  user: AuthUser;
  login: (mobileOrUsername: string, passwordOrDepartment?: string) => Promise<{success: boolean, error?: string, userType?: 'user' | 'admin' | 'department'}>;
  register: (name: string, mobile: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  incrementCivicPoints: (userId: string, points: number) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// This is a mock in-memory store for users since we are not using a real backend for user management.
const mockUserStore: { [mobile: string]: User } = {};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ type: 'loading' });

  // This effect hook handles the authentication state persistence
  useEffect(() => {
    // For this prototype, we'll use localStorage to persist the session
    const storedUser = localStorage.getItem('voice2action-user');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        } catch (e) {
            setUser({ type: 'guest' });
        }
    } else {
        setUser({ type: 'guest' });
    }
  }, []);

  const persistUser = (user: AuthUser) => {
    if (user.type === 'guest' || user.type === 'loading') {
        localStorage.removeItem('voice2action-user');
    } else {
        localStorage.setItem('voice2action-user', JSON.stringify(user));
    }
    setUser(user);
  }


  const login = async (identifier: string, secret?: string): Promise<{success: boolean, error?: string, userType?: 'user' | 'admin' | 'department'}> => {
    // Admin login
    if (identifier === 'lowell' && secret === 'lowell') {
        const adminData = { name: 'Lowell', email: 'admin@voice2action.com' };
        persistUser({ type: 'admin', data: adminData });
        return { success: true, userType: 'admin' };
    }
    
    // Department login
    if (secret && identifier === secret) { 
        persistUser({ type: 'department', data: { name: secret, department: secret } });
        return { success: true, userType: 'department' };
    }
    
    // User login
    const mobile = identifier;
    const existingUser = Object.values(mockUserStore).find(u => u.mobile === mobile);
    
    if (existingUser) {
        persistUser({ type: 'user', data: existingUser });
        return { success: true, userType: 'user' };
    }

    // In this simplified flow, if the user doesn't exist, we will create them.
    // This blurs login/register, but avoids the complexity of a real user database for the prototype.
    const newUser = {
        id: `user-${mobile}`,
        name: `User ${mobile}`,
        mobile: mobile,
        avatarUrl: `https://picsum.photos/seed/${mobile}/100/100`,
        civicPoints: 0,
    };
    mockUserStore[mobile] = newUser;
    persistUser({ type: 'user', data: newUser });
    return { success: true, userType: 'user' };
  };

  const register = async (name: string, mobile: string): Promise<{success: boolean, error?: string}> => {
    if (mockUserStore[mobile]) {
        return { success: false, error: "A user with this mobile number already exists. Please login." };
    }

    const newUser: User = {
      id: `user-${Date.now()}`, // Simple unique ID
      name: name,
      mobile: mobile,
      avatarUrl: `https://picsum.photos/seed/${name.split(' ').join('')}/100/100`,
      civicPoints: 0,
    };
    
    mockUserStore[mobile] = newUser;
    persistUser({ type: 'user', data: newUser });
  
    return { success: true };
  };
  
  const logout = async () => {
    persistUser({ type: 'guest' });
  };
  
  const updateUser = async (updates: Partial<User>) => {
    if (user.type === 'user') {
        const updatedUserData = { ...user.data, ...updates };
        mockUserStore[user.data.mobile] = updatedUserData;
        persistUser({
            ...user,
            data: updatedUserData
        });
    }
  };
  
  const incrementCivicPoints = async (userId: string, points: number) => {
      if (user.type === 'user' && user.data.id === userId) {
          const newPoints = (user.data.civicPoints || 0) + points;
          const updatedUserData = { ...user.data, civicPoints: newPoints };
          mockUserStore[user.data.mobile] = updatedUserData;
           persistUser({ type: 'user', data: updatedUserData });
      }
  };

  const value = useMemo(() => ({ user, login, register, logout, updateUser, incrementCivicPoints }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
