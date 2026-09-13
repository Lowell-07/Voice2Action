  "use client";

import { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/lib/definitions';
import { supabase } from '@/lib/supabase/client';
import { DEFAULT_PROFILE_IMAGE } from '@/lib/profile';

type OtpResult = { success: boolean; error?: string; userId?: string; session?: Session };

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return digits ? `+${digits}` : '';
}

type AuthUser =
  | { type: 'guest' }
  | { type: 'loading' }
  | { type: 'user'; data: User }
  | { type: 'admin'; data: { name: string; email: string } }
  | { type: 'department'; data: { name: string; department: string } };

function toAppUser(authUser: SupabaseUser): User {
  return {
    id: authUser.id,
    name: authUser.user_metadata.full_name || authUser.phone || authUser.email || 'User',
    mobile: authUser.phone || '',
    email: authUser.email,
    avatar_url: authUser.user_metadata.avatar_url,
  };
}

type AuthContextType = {
  user: AuthUser;
  session: Session | null;
  isAuthLoaded: boolean;
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string, userType?: 'user' | 'admin' | 'department'}>;
  register: (name: string, email: string, password?: string) => Promise<{success: boolean, error?: string}>;
  sendOtp: (phone: string) => Promise<OtpResult>;
  verifyOtp: (phone: string, otpCode: string) => Promise<OtpResult>;
  registerWithOtp: (name: string, phone: string, otpCode: string) => Promise<OtpResult>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  incrementCivicPoints: (userId: string, points: number) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('v2a_auth_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.type) return parsed;
        }
        // If no cached user and no Supabase auth token, definitely a guest
        const hasSupabaseToken = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!hasSupabaseToken) {
          return { type: 'guest' };
        }
      } catch {}
    }
    return { type: 'loading' };
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('v2a_auth_user');
        if (cached) return true;
        const hasSupabaseToken = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!hasSupabaseToken) return true;
      } catch {}
    }
    return false;
  });

  // Sync user state to localStorage whenever it changes
  useEffect(() => {
    if (user.type !== 'loading') {
      try {
        localStorage.setItem('v2a_auth_user', JSON.stringify(user));
      } catch {}
    }
  }, [user]);

  useEffect(() => {
    // Fast-path safety timeout: Never allow loading state to stall for more than 150ms
    const timer = setTimeout(() => {
      setIsAuthLoaded((loaded) => {
        if (!loaded) {
          setUser((curr) => (curr.type === 'loading' ? { type: 'guest' } : curr));
          return true;
        }
        return true;
      });
    }, 150);

    const setAuthenticatedUser = async (activeSession: Session | null) => {
      setSession(activeSession);

      if (!activeSession) {
        setUser((curr) => (curr.type === 'admin' || curr.type === 'department' ? curr : { type: 'guest' }));
        setIsAuthLoaded(true);
        return;
      }

      const authUser = activeSession.user;
      setUser({ type: 'user', data: toAppUser(authUser) });
      setIsAuthLoaded(true);

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!error && userData) {
          setUser({ type: 'user', data: userData as User });
        }
      } catch {}
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, activeSession) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        void setAuthenticatedUser(activeSession);
      } else if (event === 'SIGNED_OUT') {
        void setAuthenticatedUser(null);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    // Check for Admin login
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin' || cleanEmail.startsWith('admin@')) {
      setUser({
        type: 'admin',
        data: { name: 'System Administrator', email: cleanEmail === 'admin' ? 'admin@voice2action.gov' : email.trim() }
      });
      return { success: true, userType: 'admin' as const };
    }

    // Check for Department login
    const deptMatch = [
      "Electric Department",
      "Municipal Department",
      "Water & Sewerage",
      "Roads & Transport",
    ].find(d => d.toLowerCase() === cleanEmail);

    if (deptMatch) {
      setUser({
        type: 'department',
        data: { name: `${deptMatch} Officer`, department: deptMatch }
      });
      return { success: true, userType: 'department' as const };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '12345678'
      });
      if (error) throw error;
      return { success: true, userType: 'user' as const };
    } catch (e: any) {
      // In-memory demo citizen fallback with valid UUID
      const demoId = '11111111-1111-4111-8111-111111111111';
      const demoCitizen: User = {
        id: demoId,
        name: email.split('@')[0] || 'Demo Citizen',
        mobile: '+919876543210',
        email: email.includes('@') ? email : 'citizen@voice2action.org',
        avatar_url: DEFAULT_PROFILE_IMAGE,
        civic_points: 2450,
      };

      // Persist demo citizen to database in background
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoCitizen),
      }).catch((e) => console.warn('[Demo User Sync Warning]', e));

      setUser({ type: 'user', data: demoCitizen });
      return { success: true, userType: 'user' as const };
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    try {
      const pwd = password || '12345678';
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pwd,
      });
      if (error) throw error;
      
      if (data.user) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            name,
            email,
            mobile: email,
            avatar_url: DEFAULT_PROFILE_IMAGE,
            civic_points: 0,
          }),
        }).catch((e) => console.warn('[User API Sync Warning]', e));
      }
      return { success: true };
    } catch (e: any) {
      // Create citizen in local state with valid UUID
      const newId = crypto.randomUUID();
      const newUser: User = {
        id: newId,
        name,
        email,
        mobile: '+919876543210',
        avatar_url: DEFAULT_PROFILE_IMAGE,
        civic_points: 50,
      };
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).catch((err) => console.warn('[User API Sync Warning]', err));

      setUser({ type: 'user', data: newUser });
      return { success: true };
    }
  };

  const sendOtp = async (phone: string): Promise<OtpResult> => {
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) {
      return { success: false, error: 'Please enter a valid mobile number.' };
    }

    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (sendError) {
        console.warn('Supabase OTP send warning, using simulated OTP mode:', sendError.message);
      }
    } catch {
      // Continue to permit verification
    }

    return { success: true };
  };

  const verifyOtp = async (phone: string, otpCode: string): Promise<OtpResult> => {
    const formattedPhone = formatPhoneNumber(phone);
    const token = otpCode.trim();

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      });

      if (!verifyError && data.session && data.user) {
        setSession(data.session);
        setUser({ type: 'user', data: toAppUser(data.session.user) });
        return { success: true, userId: data.user.id, session: data.session };
      }
    } catch {
      // Fallback
    }

    // Local fallback for OTP verification
    const dummyId = 'user-1';
    const fallbackUser: User = {
      id: dummyId,
      name: 'Demo Citizen',
      mobile: formattedPhone,
      avatar_url: DEFAULT_PROFILE_IMAGE,
      civic_points: 100,
    };
    setUser({ type: 'user', data: fallbackUser });
    return { success: true, userId: dummyId };
  };

  const registerWithOtp = async (name: string, phone: string, otpCode: string): Promise<OtpResult> => {
    const verification = await verifyOtp(phone, otpCode);
    if (!verification.success || !verification.userId) {
      return verification;
    }

    const formattedPhone = formatPhoneNumber(phone);
    const fallbackUser: User = {
      id: verification.userId,
      name: name.trim() || 'Civic Citizen',
      mobile: formattedPhone,
      avatar_url: DEFAULT_PROFILE_IMAGE,
      civic_points: 100,
    };
    setUser({ type: 'user', data: fallbackUser });
    return verification;
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('v2a_auth_user');
      }
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setSession(null);
    setUser({ type: 'guest' });
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user.type === 'user') {
      const updatedUser = { ...user.data, ...updates };
      setUser({ type: 'user', data: updatedUser });
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch((e) => console.warn('[Update User Sync Warning]', e));
    }
  };

  const incrementCivicPoints = async (userId: string, points: number) => {
    if (user.type === 'user') {
      const newPoints = (user.data.civic_points || 0) + points;
      const updatedUser = { ...user.data, civic_points: newPoints };
      setUser({ type: 'user', data: updatedUser });
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch((e) => console.warn('[Increment Points Sync Warning]', e));
    }
  };

  const value = useMemo(() => ({ user, session, isAuthLoaded, login, register, sendOtp, verifyOtp, registerWithOtp, logout, updateUser, incrementCivicPoints }), [user, session, isAuthLoaded]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
