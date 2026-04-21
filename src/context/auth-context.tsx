
"use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '@/lib/definitions';
import { onAuthStateChanged, signInWithCustomToken, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc, serverTimestamp, getFirestore, collection, addDoc, updateDoc, increment, query, onSnapshot, getDocs, deleteDoc, where } from 'firebase/firestore';
import { DEFAULT_PROFILE_IMAGE, getProfileImageSrc } from '@/lib/profile';

type AuthUser =
  | { type: 'guest' }
  | { type: 'loading' }
  | { type: 'user'; data: User }
  | { type: 'admin'; data: { name: string; email: string } }
  | { type: 'department'; data: { name: string; department: string } };

type AuthContextType = {
  user: AuthUser;
  isAuthLoaded: boolean;
  login: (mobileOrUsername: string, passwordOrDepartment?: string) => Promise<{success: boolean, error?: string, userType?: 'user' | 'admin' | 'department'}>;
  register: (name: string, mobile: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  incrementCivicPoints: (userId: string, points: number) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ type: 'loading' });
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  // This effect hook handles the authentication state persistence and live updates
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
        const storedUserString = localStorage.getItem('voice2action-user');
        if (storedUserString) {
            const storedUser = JSON.parse(storedUserString);
            
            if (storedUser.type === 'user' && storedUser.data?.id) {
                // Set initial user state from local storage to avoid flicker
                setUser(storedUser); 
                
                // Subscribe to live updates for the user
                const userDocRef = doc(db, 'users', storedUser.data.id);
                unsubscribe = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const latestUserData = { id: doc.id, ...doc.data() } as User;
                        latestUserData.avatarUrl = getProfileImageSrc(latestUserData.avatarUrl);
                        const updatedAuthUser = { type: 'user' as const, data: latestUserData };
                        persistUser(updatedAuthUser); // Update local storage as well
                    } else {
                        // User was deleted, log them out.
                        logout();
                    }
                });
            } else if (storedUser.type === 'admin' || storedUser.type === 'department') {
                 setUser(storedUser);
            }
            else {
                setUser({ type: 'guest' });
            }
        } else {
            setUser({ type: 'guest' });
        }
    } catch (e) {
        setUser({ type: 'guest' });
    } finally {
        setIsAuthLoaded(true);
    }
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const persistUser = (userToPersist: AuthUser) => {
    if (userToPersist.type === 'guest' || userToPersist.type === 'loading') {
        localStorage.removeItem('voice2action-user');
    } else {
        localStorage.setItem('voice2action-user', JSON.stringify(userToPersist));
    }
    setUser(userToPersist);
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
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("mobile", "==", mobile));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const existingUser = { id: userDoc.id, ...userDoc.data() } as User;
            existingUser.avatarUrl = getProfileImageSrc(existingUser.avatarUrl);
            persistUser({ type: 'user', data: existingUser });
            // The useEffect will now automatically handle live updates.
            return { success: true, userType: 'user' };
        }
    } catch(e) {
        console.error("Login error", e);
        return { success: false, error: 'A database error occurred.' };
    }

    return { success: false, error: 'User not found. Please register.' };
  };

  const register = async (name: string, mobile: string): Promise<{success: boolean, error?: string}> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("mobile", "==", mobile));
    
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { success: false, error: "A user with this mobile number already exists. Please login." };
        }

        const newUserRef = doc(collection(db, "users"));
        const newUser: User = {
          id: newUserRef.id,
          name: name,
          mobile: mobile,
          avatarUrl: DEFAULT_PROFILE_IMAGE,
          civicPoints: 0,
        };
        
        await setDoc(newUserRef, newUser);
        persistUser({ type: 'user', data: newUser });
      
        return { success: true };
    } catch(e) {
        console.error("Registration error", e);
        return { success: false, error: 'A database error occurred during registration.' };
    }
  };
  
  const logout = async () => {
    persistUser({ type: 'guest' });
  };
  
  const updateUser = async (updates: Partial<User>) => {
    if (user.type === 'user') {
        const userDocRef = doc(db, 'users', user.data.id);
        await updateDoc(userDocRef, {
          ...updates,
          avatarUrl: getProfileImageSrc(updates.avatarUrl ?? user.data.avatarUrl),
        });
        // Live listener will handle the UI update
    }
  };
  
  const incrementCivicPoints = async (userId: string, points: number) => {
      if (!userId) {
          console.error("Cannot increment points: userId is missing.");
          return;
      }
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            civicPoints: increment(points)
        });
        // Live listener will handle the UI update for the current user
      } catch (error) {
        console.error("Error incrementing civic points for user", userId, error);
      }
  };

  const value = useMemo(() => ({ user, isAuthLoaded, login, register, logout, updateUser, incrementCivicPoints }), [user, isAuthLoaded]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
