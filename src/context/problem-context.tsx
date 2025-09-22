
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback } from 'react';
import type { Problem } from '@/lib/definitions';
import { mockProblems } from '@/lib/data';

type ProblemContextType = {
  problems: Problem[];
  addProblem: (problem: Problem) => void;
  updateProblem: (problemId: string, updates: Partial<Problem>) => void;
  voteOnProblem: (problemId: string, voteType: 'like' | 'dislike') => void;
};

export const ProblemContext = createContext<ProblemContextType | undefined>(
  undefined
);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'like' | 'dislike' | null}>({});

  const addProblem = (problem: Problem) => {
    setProblems(prevProblems => [problem, ...prevProblems]);
  };
  
  const updateProblem = (problemId: string, updates: Partial<Problem>) => {
    setProblems(prevProblems => 
        prevProblems.map(p => p.id === problemId ? { ...p, ...updates } : p)
    );
  };
  
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


  const value = useMemo(() => ({ problems, addProblem, updateProblem, voteOnProblem }), [problems, voteOnProblem]);

  return <ProblemContext.Provider value={value}>{children}</ProblemContext.Provider>;
}

export const useProblems = () => {
  const context = useContext(ProblemContext);
  if (context === undefined) {
    throw new Error('useProblems must be used within a ProblemProvider');
  }
  return context;
};
