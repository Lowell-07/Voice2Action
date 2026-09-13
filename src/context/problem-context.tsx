"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import { mockProblems } from '@/lib/data';

type ProblemContextType = {
  problems: Problem[];
  addProblem: (problem: any) => Promise<Problem | null>;
  updateProblem: (problemId: string, updates: Partial<Problem>) => void;
  deleteProblem: (problemId: string) => Promise<{ success: boolean; error?: string }>;
  voteOnProblem: (problemId: string, voteType: 'like' | 'dislike') => void;
};

export const ProblemContext = createContext<ProblemContextType | undefined>(undefined);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchProblems = async () => {
      try {
        const response = await fetch('/api/issues');
        if (response.ok) {
          const data = await response.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setProblems(data as Problem[]);
            return;
          }
        }
      } catch (err) {
        console.warn('[ProblemContext] Could not fetch issues from API:', err);
      }
    };

    fetchProblems();

    // Supabase Realtime with defensive error handling
    let channel: any = null;
    try {
      channel = supabase
        .channel('public:issues')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'issues' },
          () => {
            if (isMounted) {
              fetchProblems().catch((err) => console.warn('[Realtime refresh error]', err));
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[Supabase Realtime] Channel status: ${status}. Running in polling/manual mode.`);
          }
        });
    } catch (realtimeErr) {
      console.warn('[Supabase Realtime subscription skipped/failed]:', realtimeErr);
    }

    return () => {
      isMounted = false;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn('[Supabase Realtime removal warning]:', e);
        }
      }
    };
  }, []);

  const addProblem = useCallback(async (problemData: any): Promise<Problem | null> => {
    const userId = user.type === 'user' ? user.data.id : null;
    const userName = user.type === 'user' ? user.data.name : 'Citizen Reporter';

    const payload = {
      title: problemData.title || 'Untitled Issue',
      description: problemData.description || '',
      department: problemData.department || 'Municipal Department',
      issue_type: problemData.issue_type || 'General',
      status: 'Awaiting Approval',
      address: problemData.address || '',
      state: problemData.state || '',
      city: problemData.city || '',
      lat: problemData.lat || 0,
      lng: problemData.lng || 0,
      media_images: problemData.media_images || [],
      reported_by: userId,
      reported_by_name: userName,
      reported_by_email: user.type === 'user' ? user.data.email : undefined,
    };

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.error('[Add Problem Failed]', errJson.error || response.statusText);
        return null;
      }

      const resData = await response.json();
      const savedProblem: Problem = resData.issue || {
        ...payload,
        id: resData.id,
        likes: 0,
        dislikes: 0,
        created_at: new Date().toISOString(),
      };

      // Add to state only after verified database success
      setProblems((prev) => [savedProblem, ...prev.filter((p) => p.id !== savedProblem.id)]);
      return savedProblem;
    } catch (error) {
      console.error('[Add Problem Network Error]', error);
      return null;
    }
  }, [user]);

  const updateProblem = useCallback(async (problemId: string, updates: Partial<Problem>) => {
    setProblems((prev) => prev.map((p) => (p.id === problemId ? { ...p, ...updates } : p)));

    try {
      const res = await fetch(`/api/issues/${problemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        console.warn(`[Update Problem Warning] Server returned ${res.status}`);
      }
    } catch (error) {
      console.error('[Error updating problem]:', error);
    }
  }, []);

  const deleteProblem = useCallback(async (problemId: string): Promise<{ success: boolean; error?: string }> => {
    setProblems((prev) => prev.filter((p) => p.id !== problemId));

    try {
      const res = await fetch(`/api/issues/${problemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Failed to delete issue' };
      }
      return { success: true };
    } catch (error: any) {
      console.warn('[Delete problem warning]:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const field = voteType === 'like' ? 'likes' : 'dislikes';
    let newCount = 1;

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          newCount = (p[field] || 0) + 1;
          return { ...p, [field]: newCount };
        }
        return p;
      })
    );

    try {
      await fetch(`/api/issues/${problemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newCount }),
      });
    } catch (err) {
      console.warn('[Vote sync error]:', err);
    }
  }, []);

  const value = useMemo(() => ({ problems, addProblem, updateProblem, deleteProblem, voteOnProblem }), [problems, addProblem, updateProblem, deleteProblem, voteOnProblem]);

  return <ProblemContext.Provider value={value}>{children}</ProblemContext.Provider>;
}

export const useProblems = () => {
  const context = useContext(ProblemContext);
  if (context === undefined) {
    throw new Error('useProblems must be used within a ProblemProvider');
  }
  return context;
};
