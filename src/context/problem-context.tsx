
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { collection, doc, addDoc, updateDoc, increment, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
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
    
    if (user.type === 'user') {
        const q = query(collection(db, "problems"), where("reportedById", "==", user.data.id));
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            const problemsData: Problem[] = [];
            querySnapshot.forEach((doc) => {
                problemsData.push({ id: doc.id, ...doc.data() } as Problem);
            });
            problemsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setProblems(problemsData);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
        });
    } else {
        setProblems([]);
    }

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user]);


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
        
        // Optimistically add the new problem to the local state
        setProblems(prevProblems => [newProblem, ...prevProblems]);

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
        setProblems(prevProblems => 
            prevProblems.map(p => p.id === problemId ? { ...p, ...updates } : p)
        );
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
        
        return { success: true };

    } catch (error) {
        setProblems(originalProblems);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
  }, [user, problems]);
  
  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const problemRef = doc(db, "problems", problemId);
    const currentVote = userVotes[problemId];

    const updates: {[key: string]: any} = {};

    setProblems(prevProblems => prevProblems.map(p => {
        if (p.id === problemId) {
            const newLikes = p.likes;
            const newDislikes = p.dislikes;

            if (currentVote === voteType) { // Toggling off
                if (voteType === 'like') updates['likes'] = increment(-1);
                else updates['dislikes'] = increment(-1);
                setUserVotes(prev => ({...prev, [problemId]: null}));
                return {...p, likes: voteType === 'like' ? newLikes - 1: newLikes, dislikes: voteType === 'dislike' ? newDislikes - 1: newDislikes};
            } else { // New or changing vote
                if (voteType === 'like') updates['likes'] = increment(1);
                else updates['dislikes'] = increment(1);
                
                if (currentVote) { // Changing vote
                    if (currentVote === 'like') updates['likes'] = increment(-1);
                    else updates['dislikes'] = increment(-1);
                }
                setUserVotes(prev => ({...prev, [problemId]: voteType}));
                return {...p, 
                    likes: voteType === 'like' ? newLikes + (currentVote === 'dislike' ? 0 : 1) : (currentVote === 'like' ? newLikes -1 : newLikes), 
                    dislikes: voteType === 'dislike' ? newDislikes + (currentVote === 'like' ? 0 : 1) : (currentVote === 'dislike' ? newDislikes -1 : newDislikes)
                };
            }
        }
        return p;
    }));

    try {
        await updateDoc(problemRef, updates);
    } catch(error) {
        console.error("Error voting on problem:", error);
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
