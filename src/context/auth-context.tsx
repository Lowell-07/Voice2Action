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
  const [user, setUser] = useState<AuthUser>({ type: 'loading' });
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const setAuthenticatedUser = async (activeSession: Session | null) => {
      setSession(activeSession);
      console.log('Current Auth User State:', activeSession?.user ?? null);

      if (!activeSession) {
        setUser({ type: 'guest' });
        setIsAuthLoaded(true);
        return;
      }

      const authUser = activeSession.user;
      setUser({ type: 'user', data: toAppUser(authUser) });
      setIsAuthLoaded(true);

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && userData) {
        setUser({ type: 'user', data: userData as User });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, activeSession) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        void setAuthenticatedUser(activeSession);
      } else if (event === 'SIGNED_OUT') {
        void setAuthenticatedUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '12345678'
      });
      if (error) throw error;
      return { success: true, userType: 'user' as const };
    } catch (e: any) {
      return { success: false, error: e.message };
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
        await supabase.from('users').insert({
          id: data.user.id,
          name,
          email,
          mobile: email, // Fallback
          avatar_url: DEFAULT_PROFILE_IMAGE,
          civic_points: 0,
        });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const sendOtp = async (phone: string): Promise<OtpResult> => {
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) {
      return { success: false, error: 'Please enter a valid mobile number.' };
    }

    const { error: sendError } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (sendError) {
      console.error('Supabase OTP send error:', sendError.message);
      return { success: false, error: sendError.message };
    }

    return { success: true };
  };

  const verifyOtp = async (phone: string, otpCode: string): Promise<OtpResult> => {
    const formattedPhone = formatPhoneNumber(phone);
    const token = otpCode.trim();
    console.log('Submitting to Supabase Auth:', { phone: formattedPhone, token: otpCode });

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });

    if (verifyError) {
      console.error('Supabase OTP verification error:', verifyError.message);
      return { success: false, error: verifyError.message };
    }

    if (!data.session || !data.user) {
      return { success: false, error: 'OTP verification did not create an authenticated session.' };
    }

    setSession(data.session);
    setUser({ type: 'user', data: toAppUser(data.session.user) });
    console.log('Current Auth User State:', data.session.user);
    return { success: true, userId: data.user.id, session: data.session };
  };

  const registerWithOtp = async (name: string, phone: string, otpCode: string): Promise<OtpResult> => {
    const verification = await verifyOtp(phone, otpCode);
    if (!verification.success || !verification.userId) {
      return verification;
    }

    const formattedPhone = formatPhoneNumber(phone);
    const { data: userData, error } = await supabase
      .from('users')
      .upsert({
        id: verification.userId,
        name: name.trim(),
        mobile: formattedPhone,
        avatar_url: DEFAULT_PROFILE_IMAGE,
        civic_points: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase profile creation error:', error.message);
      return { success: false, error: error.message };
    }

    setUser({ type: 'user', data: userData as User });
    return verification;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user.type === 'user') {
      await supabase.from('users').update(updates).eq('id', user.data.id);
      setUser({ type: 'user', data: { ...user.data, ...updates } });
    }
  };

  const incrementCivicPoints = async (userId: string, points: number) => {
    if (user.type === 'user') {
      const { data: userData } = await supabase.from('users').select('civic_points').eq('id', userId).single();
      if (userData) {
        await supabase.from('users').update({ civic_points: (userData.civic_points || 0) + points }).eq('id', userId);
      }
    }
  };

  const value = useMemo(() => ({ user, session, isAuthLoaded, login, register, sendOtp, verifyOtp, registerWithOtp, logout, updateUser, incrementCivicPoints }), [user, session, isAuthLoaded]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
