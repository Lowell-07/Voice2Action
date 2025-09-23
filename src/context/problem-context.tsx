
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { collection, doc, addDoc, updateDoc, increment, onSnapshot, query, Unsubscribe, getDocs, deleteDoc } from 'firebase/firestore';
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
    // Using onSnapshot to listen for real-time updates to the problems collection.
    const q = query(collection(db, "problems"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const problemsData: Problem[] = [];
        querySnapshot.forEach((doc) => {
            problemsData.push({ id: doc.id, ...doc.data() } as Problem);
        });
        problemsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProblems(problemsData);
    });

    return () => unsubscribe();
  }, []);


  const addProblem = useCallback(async (problemData: Omit<Problem, 'id' | 'createdAt' | 'reportedById' | 'reportedBy'>): Promise<Problem | null> => {
    if (user.type !== 'user') {
        console.error("User is not authenticated");
        return null;
    }

    try {
        const newProblemData = {
            ...problemData,
            createdAt: new Date().toISOString(),
            reportedById: user.data.id, // Ensure this is a string
            reportedBy: {
                id: user.data.id,
                name: user.data.name,
                avatarUrl: user.data.avatarUrl,
            },
        };

        const docRef = await addDoc(collection(db, "problems"), newProblemData);
        
        const newProblem: Problem = {
            id: docRef.id,
            ...newProblemData,
        } as Problem;
        
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
        // The onSnapshot listener will handle the local state update automatically.
    } catch(error) {
        console.error("Error updating problem:", error);
    }
  }, []);

  const deleteProblem = useCallback(async (problemId: string): Promise<{ success: boolean; error?: string }> => {
    // Note: The provided /api/delete-issue endpoint is complex and relies on Firebase Admin SDK
    // which is not suitable for a purely client-side prototype.
    // This simplified version deletes directly from the client, relying on security rules.
    if (user.type !== 'user') {
      return { success: false, error: "You must be logged in to delete an issue." };
    }

    const problemToDelete = problems.find(p => p.id === problemId);
    if (!problemToDelete) return { success: false, error: "Problem not found." };
    if (problemToDelete.reportedById !== user.data.id) {
      return { success: false, error: "You do not have permission to delete this issue." };
    }

    try {
        await deleteDoc(doc(db, "problems", problemId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting problem:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
  }, [user, problems]);
  
  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const problemRef = doc(db, "problems", problemId);
    const currentVote = userVotes[problemId];

    const updates: {[key: string]: any} = {};

    // Optimistically update UI first
    setProblems(prevProblems => prevProblems.map(p => {
        if (p.id === problemId) {
            let newLikes = p.likes;
            let newDislikes = p.dislikes;

            if (currentVote === voteType) { // Toggling off
                if (voteType === 'like') { updates['likes'] = increment(-1); newLikes--; }
                else { updates['dislikes'] = increment(-1); newDislikes--; }
                setUserVotes(prev => ({...prev, [problemId]: null}));

            } else { // New or changing vote
                if (voteType === 'like') updates['likes'] = increment(1);
                else updates['dislikes'] = increment(1);
                
                if (currentVote === 'like') { updates['likes'] = increment(-1); newLikes--; }
                else if (currentVote === 'dislike') { updates['dislikes'] = increment(-1); newDislikes--; }

                if (voteType === 'like') newLikes++;
                else newDislikes++;

                setUserVotes(prev => ({...prev, [problemId]: voteType}));
            }
            return {...p, likes: newLikes, dislikes: newDislikes };
        }
        return p;
    }));

    try {
        await updateDoc(problemRef, updates);
    } catch(error) {
        console.error("Error voting on problem:", error);
        // Here you could revert the optimistic update if the DB call fails
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
