
"use client";

import { createContext, useState, ReactNode, useMemo, useContext } from 'react';
import type { Problem } from '@/lib/definitions';
import { mockProblems } from '@/lib/data';

type ProblemContextType = {
  problems: Problem[];
  addProblem: (problem: Problem) => void;
  updateProblem: (problemId: string, updates: Partial<Problem>) => void;
};

export const ProblemContext = createContext<ProblemContextType | undefined>(
  undefined
);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>(mockProblems);

  const addProblem = (problem: Problem) => {
    setProblems(prevProblems => [problem, ...prevProblems]);
  };
  
  const updateProblem = (problemId: string, updates: Partial<Problem>) => {
    setProblems(prevProblems => 
        prevProblems.map(p => p.id === problemId ? { ...p, ...updates } : p)
    );
  };

  const value = useMemo(() => ({ problems, addProblem, updateProblem }), [problems]);

  return <ProblemContext.Provider value={value}>{children}</ProblemContext.Provider>;
}

export const useProblems = () => {
  const context = useContext(ProblemContext);
  if (context === undefined) {
    throw new Error('useProblems must be used within a ProblemProvider');
  }
  return context;
};
