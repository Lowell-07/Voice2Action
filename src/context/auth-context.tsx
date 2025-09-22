
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
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ type: 'guest' });

  const login = (type: 'user' | 'admin' | 'department', nameOrDepartment?: string, mobile?: string) => {
    if (type === 'user') {
      if (nameOrDepartment && mobile) {
        // This is a new registration
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: nameOrDepartment,
          mobile: mobile,
          avatarUrl: `https://picsum.photos/seed/${nameOrDepartment}/100/100`,
        };
        setUser({ type: 'user', data: newUser });
      } else {
        // This is a login for an existing user
        setUser({ type: 'user', data: mockUsers[0] });
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

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
