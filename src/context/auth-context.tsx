
"use client";

import { createContext, useState, ReactNode, useMemo } from 'react';
import type { User } from '@/lib/definitions';
import { mockUsers } from '@/lib/data';

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


  const login = (type: 'user' | 'admin' | 'department', nameOrDepartment?: string, mobile?: string) => {
    if (type === 'user') {
      if (nameOrDepartment && mobile) {
        // This is a new registration
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: nameOrDepartment,
          mobile: mobile,
          avatarUrl: `https://picsum.photos/seed/${nameOrDepartment}/100/100`,
          civicPoints: 0,
        };
        setUser({ type: 'user', data: newUser });
        setAllUsers(prev => [...prev, newUser]);
      } else {
        // This is a login for an existing user (mocked)
        setUser({ type: 'user', data: allUsers[0] });
      }
    } else if (type === 'admin') {
      setUser({ type: 'admin', data: { name: 'Admin User', email: 'admin@voice2action.com' } });
    } else {
       setUser({ type: 'department', data: { name: 'Dept Head', department: nameOrDepartment || 'Roads & Transport' } });
    }
  };

  const logout = () => {
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
          setUser(prevUser => ({
              ...prevUser,
              data: {
                  ...(prevUser as { type: 'user', data: User }).data,
                  civicPoints: ((prevUser as { type: 'user', data: User }).data.civicPoints || 0) + points
              }
          }));
      }
  };

  const value = useMemo(() => ({ user, login, logout, updateUser, incrementCivicPoints }), [user, allUsers]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
