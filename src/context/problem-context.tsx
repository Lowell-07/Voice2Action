
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback } from 'react';
import type { Problem } from '@/lib/definitions';
import { mockProblems } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';

type ProblemContextType = {
  problems: Problem[];
  addProblem: (problem: Problem) => void;
  updateProblem: (problemId: string, updates: Partial<Problem>) => void;
  deleteProblem: (problemId: string) => Promise<{ success: boolean; error?: string }>;
  voteOnProblem: (problemId: string, voteType: 'like' | 'dislike') => void;
};

export const ProblemContext = createContext<ProblemContextType | undefined>(
  undefined
);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const { user } = useAuth();

  const addProblem = useCallback((problem: Problem) => {
    setProblems(prevProblems => [problem, ...prevProblems]);
  }, []);
  
  const updateProblem = useCallback((problemId: string, updates: Partial<Problem>) => {
    setProblems(prevProblems => 
        prevProblems.map(p => p.id === problemId ? { ...p, ...updates } : p)
    );
  }, []);

  const deleteProblem = useCallback(async (problemId: string): Promise<{ success: boolean; error?: string }> => {
    if (user.type !== 'user' || !user.data.idToken) {
      return { success: false, error: "You must be logged in to delete an issue." };
    }

    const originalProblems = [...problems];
    const problemToDelete = problems.find(p => p.id === problemId);
    
    // Optimistically update the UI
    setProblems(prevProblems => prevProblems.filter(p => p.id !== problemId));

    try {
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
            throw new Error(errorData.error || 'Failed to delete the issue on the server.');
        }
        
        // If successful, the optimistic update is now the source of truth
        return { success: true };

    } catch (error) {
        // If the API call fails, revert the state and return an error
        setProblems(originalProblems);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
  }, [user, problems]);
  
  const voteOnProblem = useCallback((problemId: string, voteType: 'like' | 'dislike') => {
    // This is an optimistic update on the client side.
    // In a real app, you'd add a server call here with a try/catch to revert on failure.
    setProblems(prevProblems => {
      return prevProblems.map(p => {
        if (p.id !== problemId) {
          return p;
        }

        const problem = { ...p };
        const currentVote = userVotes[problemId];
        
        // Reset previous vote count
        if (currentVote === 'like') problem.likes--;
        if (currentVote === 'dislike') problem.dislikes--;

        // Apply new vote or toggle off
        if (currentVote === voteType) {
          // User is toggling off their vote
          setUserVotes(prev => ({ ...prev, [problemId]: null }));
        } else {
          // User is casting a new or different vote
          if (voteType === 'like') problem.likes++;
          if (voteType === 'dislike') problem.dislikes++;
          setUserVotes(prev => ({ ...prev, [problemId]: voteType }));
        }
        
        return problem;
      });
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
