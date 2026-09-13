"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';

type ProblemContextType = {
  problems: Problem[];
  addProblem: (problem: any) => Promise<Problem | null>;
  updateProblem: (problemId: string, updates: Partial<Problem>) => void;
  deleteProblem: (problemId: string) => Promise<{ success: boolean; error?: string }>;
  voteOnProblem: (problemId: string, voteType: 'like' | 'dislike') => void;
};

export const ProblemContext = createContext<ProblemContextType | undefined>(undefined);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProblems = async () => {
      const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
      if (data) setProblems(data as Problem[]);
    };
    fetchProblems();

    const channel = supabase.channel('public:issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, fetchProblems)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addProblem = useCallback(async (problemData: any): Promise<Problem | null> => {
    if (user.type !== 'user') return null;

    try {
      const payload = {
        ...problemData,
        reported_by: user.data.id
      };

      const response = await fetch('http://localhost:8000/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`FastAPI returned ${response.status}: ${errorBody || response.statusText}`);
      }

      const data = await response.json();

      return { id: data.id, ...payload } as Problem;
    } catch (error) {
      console.error('Failed to sync issue with FastAPI backend:', error);
      return null;
    }
  }, [user]);

  const updateProblem = useCallback(async (problemId: string, updates: Partial<Problem>) => {
    try {
      await supabase.from('issues').update(updates).eq('id', problemId);
    } catch (error) {
      console.error("Error updating problem:", error);
    }
  }, []);

  const deleteProblem = useCallback(async (problemId: string): Promise<{ success: boolean; error?: string }> => {
    if (user.type !== 'user') return { success: false, error: "You must be logged in." };

    try {
      await supabase.from('issues').delete().eq('id', problemId).eq('reported_by', user.data.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to delete from database." };
    }
  }, [user]);

  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;

    const field = voteType === 'like' ? 'likes' : 'dislikes';
    const newCount = problem[field] + 1;

    await supabase.from('issues').update({ [field]: newCount }).eq('id', problemId);
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
