
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
    // In a real app, the client SDK doesn't have delete permissions.
    // We need to call our secure backend API endpoint.
    if (user.type !== 'user' || !user.data.idToken) {
        toast({ title: "Authentication Error", description: "You must be logged in to delete issues.", variant: "destructive" });
        return;
    }
    
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
            throw new Error(errorData.error || 'Failed to delete the issue.');
        }

        // On successful API call, remove the problem from the local state.
        setProblems(prevProblems => prevProblems.filter(p => p.id !== problemId));
        toast({ title: "Issue Deleted", description: "Your reported issue has been successfully deleted." });

    } catch (error) {
        console.error("Failed to delete problem:", error);
        toast({ title: "Error", description: (error as Error).message, variant: "destructive"});
    }
  }, [user, toast]);
  
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
