
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { collection, doc, addDoc, updateDoc, increment, onSnapshot, query, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

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
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    
    // Only set up the listener if the user is authenticated.
    // The security rules can then be more restrictive.
    if (user.type !== 'guest') {
        const q = query(collection(db, "problems"));
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            const problemsData: Problem[] = [];
            querySnapshot.forEach((doc) => {
                problemsData.push({ id: doc.id, ...doc.data() } as Problem);
            });
            // Sort by creation date descending
            problemsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setProblems(problemsData);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            // Handle permission errors or other issues
        });
    } else {
        // Clear problems when user logs out
        setProblems([]);
    }

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user]); // Rerun effect when user auth state changes


  const addProblem = useCallback(async (problemData: Omit<Problem, 'id' | 'createdAt' | 'reportedById' | 'reportedBy'>): Promise<Problem | null> => {
    if (user.type !== 'user') {
        console.error("User is not authenticated");
        return null;
    }

    try {
        const docRef = await addDoc(collection(db, "problems"), {
            ...problemData,
            createdAt: new Date().toISOString(),
            reportedById: user.data.id,
            reportedBy: {
                id: user.data.id,
                name: user.data.name,
                avatarUrl: user.data.avatarUrl,
            },
        });
        // The onSnapshot listener will automatically update the local state.
        // We can return the new problem object if needed by the UI immediately.
        const newProblem: Problem = {
            id: docRef.id,
            ...problemData,
            createdAt: new Date().toISOString(),
            reportedById: user.data.id,
            reportedBy: {
                id: user.data.id,
                name: user.data.name,
                avatarUrl: user.data.avatarUrl,
            },
        }
        return newProblem;

    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
  }, [user]);
  
  const updateProblem = useCallback(async (problemId: string, updates: Partial<Problem>) => {
    const problemRef = doc(db, "problems", problemId);
    try {
        await updateDoc(problemRef, updates);
        // onSnapshot will handle the UI update.
    } catch(error) {
        console.error("Error updating problem:", error);
    }
  }, []);

  const deleteProblem = useCallback(async (problemId: string): Promise<{ success: boolean; error?: string }> => {
    if (user.type !== 'user' || !user.data.idToken) {
      return { success: false, error: "You must be logged in to delete an issue." };
    }

    const originalProblems = [...problems];
    const problemToDelete = problems.find(p => p.id === problemId);
    if (!problemToDelete) return { success: false, error: "Problem not found." };
    
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
  
  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const problemRef = doc(db, "problems", problemId);
    const currentVote = userVotes[problemId];

    const updates: {[key: string]: any} = {};

    if (currentVote === voteType) {
        // User is toggling off their vote
        updates[`${voteType}s`] = increment(-1);
        setUserVotes(prev => ({ ...prev, [problemId]: null }));
    } else {
        // User is casting a new or different vote
        updates[`${voteType}s`] = increment(1);
        if (currentVote) {
             // they are changing their vote
            updates[`${currentVote}s`] = increment(-1);
        }
        setUserVotes(prev => ({ ...prev, [problemId]: voteType }));
    }

    try {
        await updateDoc(problemRef, updates);
        // Firestore's onSnapshot will take care of updating the UI state with the final counts.
    } catch(error) {
        console.error("Error voting on problem:", error);
        // Here you could add logic to revert the optimistic userVotes state if needed.
    }
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
