
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { mockProblems } from '@/lib/data'; // Using mock data for now

type ProblemContextType = {
  problems: Problem[];
  addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'reportedById' | 'reportedBy'>) => Promise<Problem | null>;
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

  const addProblem = useCallback(async (problemData: Omit<Problem, 'id' | 'createdAt' | 'reportedById' | 'reportedBy'>): Promise<Problem | null> => {
    if (user.type !== 'user') {
        console.error("User is not authenticated");
        return null;
    }

    try {
        const userId = user.data.id;
        const newProblem: Problem = {
            id: `prob-${Date.now()}`,
            ...problemData,
            createdAt: new Date().toISOString(),
            reportedById: userId, // Ensure this is a string
            reportedBy: {
                id: userId,
                name: user.data.name,
                avatarUrl: user.data.avatarUrl,
            },
        } as Problem;
        
        setProblems(prevProblems => [newProblem, ...prevProblems]);

        return newProblem;

    } catch (error) {
        console.error("Error adding problem: ", error);
        return null;
    }
  }, [user]);
  
  const updateProblem = useCallback(async (problemId: string, updates: Partial<Problem>) => {
     setProblems(prevProblems =>
      prevProblems.map(p => (p.id === problemId ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProblem = useCallback(async (problemId: string): Promise<{ success: boolean; error?: string }> => {
    if (user.type !== 'user') {
      return { success: false, error: "You must be logged in to delete an issue." };
    }

    const problemToDelete = problems.find(p => p.id === problemId);
    if (!problemToDelete) return { success: false, error: "Problem not found." };
    
    if (String(problemToDelete.reportedById) !== String(user.data.id)) {
      return { success: false, error: "You do not have permission to delete this issue." };
    }

    setProblems(prevProblems => prevProblems.filter(p => p.id !== problemId));
    return { success: true };
  }, [user, problems]);
  
  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const currentVote = userVotes[problemId];

    // Optimistically update UI first
    setProblems(prevProblems => prevProblems.map(p => {
        if (p.id === problemId) {
            let newLikes = p.likes;
            let newDislikes = p.dislikes;

            if (currentVote === voteType) { // Toggling off
                if (voteType === 'like') newLikes--;
                else newDislikes--;
                setUserVotes(prev => ({...prev, [problemId]: null}));

            } else { // New or changing vote
                if (currentVote === 'like') newLikes--;
                else if (currentVote === 'dislike') newDislikes--;

                if (voteType === 'like') newLikes++;
                else newDislikes++;

                setUserVotes(prev => ({...prev, [problemId]: voteType}));
            }
            return {...p, likes: newLikes, dislikes: newDislikes };
        }
        return p;
    }));
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
