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
        const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (isMounted && data && data.length > 0) {
          setProblems(data as Problem[]);
        }
      } catch {
        // Keep mockProblems
      }
    };
    fetchProblems();

    try {
      const channel = supabase.channel('public:issues')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, fetchProblems)
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        isMounted = false;
      };
    }
  }, []);

  const addProblem = useCallback(async (problemData: any): Promise<Problem | null> => {
    const userId = user.type === 'user' ? user.data.id : 'user-1';

    const newProblem: Problem = {
      id: crypto.randomUUID(),
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
      likes: 0,
      dislikes: 0,
      reported_by: userId,
      created_at: new Date().toISOString(),
    };

    // Optimistically update local state immediately
    setProblems(prev => [newProblem, ...prev]);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProblem)
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.id) {
          newProblem.id = resData.id;
        }
      }
    } catch (error) {
      console.warn('API sync warning:', error);
    }

    return newProblem;
  }, [user]);

  const updateProblem = useCallback(async (problemId: string, updates: Partial<Problem>) => {
    setProblems(prev => prev.map(p => p.id === problemId ? { ...p, ...updates } : p));
    try {
      await supabase.from('issues').update(updates).eq('id', problemId);
    } catch (error) {
      console.error("Error updating problem:", error);
    }
  }, []);

  const deleteProblem = useCallback(async (problemId: string): Promise<{ success: boolean; error?: string }> => {
    setProblems(prev => prev.filter(p => p.id !== problemId));
    try {
      await supabase.from('issues').delete().eq('id', problemId);
    } catch (error) {
      console.warn("Database delete skipped or failed:", error);
    }
    return { success: true };
  }, []);

  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const field = voteType === 'like' ? 'likes' : 'dislikes';
    setProblems(prev => prev.map(p => {
      if (p.id === problemId) {
        return { ...p, [field]: (p[field] || 0) + 1 };
      }
      return p;
    }));

    try {
      const problem = problems.find(p => p.id === problemId);
      if (problem) {
        const newCount = (problem[field] || 0) + 1;
        await supabase.from('issues').update({ [field]: newCount }).eq('id', problemId);
      }
    } catch (err) {
      console.warn("Vote sync error:", err);
    }
  }, [problems]);

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
