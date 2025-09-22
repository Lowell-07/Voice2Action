
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback } from 'react';
import type { Problem } from '@/lib/definitions';
import { mockProblems } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type ProblemContextType = {
  problems: Problem[];
  addProblem: (problem: Problem) => void;
  updateProblem: (problemId: string, updates: Partial<Problem>) => void;
  deleteProblem: (problemId: string) => Promise<void>;
  voteOnProblem: (problemId: string, voteType: 'like' | 'dislike') => void;
};

export const ProblemContext = createContext<ProblemContextType | undefined>(
  undefined
);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const addProblem = useCallback((problem: Problem) => {
    setProblems(prevProblems => [problem, ...prevProblems]);
  }, []);
  
  const updateProblem = useCallback((problemId: string, updates: Partial<Problem>) => {
    setProblems(prevProblems => 
        prevProblems.map(p => p.id === problemId ? { ...p, ...updates } : p)
    );
  }, []);

  const deleteProblem = useCallback(async (problemId: string) => {
    if (user.type !== 'user' || !user.data.idToken) {
      throw new Error("You must be logged in to delete an issue.");
    }
    
    const response = await fetch('/api/delete-issue', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.data.idToken}`
        },
        body: JSON.stringify({ problemId })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete the issue.');
    }

    setProblems(prevProblems => prevProblems.filter(p => p.id !== problemId));

  }, [user]);
  
  const voteOnProblem = useCallback((problemId: string, voteType: 'like' | 'dislike') => {
    setProblems(prevProblems => {
      const newProblems = [...prevProblems];
      const problemIndex = newProblems.findIndex(p => p.id === problemId);
      if (problemIndex === -1) return prevProblems;

      const problem = { ...newProblems[problemIndex] };
      const currentVote = userVotes[problemId];

      // Reset previous vote if any
      if (currentVote === 'like') problem.likes--;
      if (currentVote === 'dislike') problem.dislikes--;

      // Apply new vote
      if (currentVote === voteType) {
        // User is toggling off their vote
        setUserVotes(prev => ({ ...prev, [problemId]: null }));
      } else {
        // User is casting a new vote or changing their vote
        if (voteType === 'like') problem.likes++;
        if (voteType === 'dislike') problem.dislikes++;
        setUserVotes(prev => ({ ...prev, [problemId]: voteType }));
      }
      
      newProblems[problemIndex] = problem;
      return newProblems;
    });
  }, [userVotes]);


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
