
"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, increment } from 'firebase/firestore';
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
    const problemsCollection = collection(db, 'problems');
    const unsubscribe = onSnapshot(problemsCollection, (snapshot) => {
      const problemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Problem));
      setProblems(problemsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    return () => unsubscribe();
  }, []);

  const addProblem = useCallback(async (problemData: Omit<Problem, 'id' | 'createdAt' | 'reportedById' | 'reportedBy'>): Promise<Problem | null> => {
    if (user.type !== 'user') {
        console.error("User is not authenticated");
        return null;
    }

    try {
        const userId = user.data.id;
        const newProblemDoc = {
            ...problemData,
            createdAt: new Date().toISOString(),
            reportedById: userId,
            reportedBy: {
                id: userId,
                name: user.data.name,
                avatarUrl: user.data.avatarUrl,
            },
        };
        
        const docRef = await addDoc(collection(db, "problems"), newProblemDoc);
        
        const newProblem: Problem = {
            id: docRef.id,
            ...newProblemDoc
        };

        return newProblem;

    } catch (error) {
        console.error("Error adding problem: ", error);
        return null;
    }
  }, [user]);
  
  const updateProblem = useCallback(async (problemId: string, updates: Partial<Problem>) => {
     try {
        const problemDocRef = doc(db, 'problems', problemId);
        await updateDoc(problemDocRef, updates);
     } catch (error) {
        console.error("Error updating problem:", error);
     }
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
    
    try {
      await deleteDoc(doc(db, 'problems', problemId));
      return { success: true };
    } catch(error) {
        console.error("Error deleting problem:", error);
        return { success: false, error: "Failed to delete from database."};
    }
  }, [user, problems]);
  
  const voteOnProblem = useCallback(async (problemId: string, voteType: 'like' | 'dislike') => {
    const currentVote = userVotes[problemId];
    const problemDocRef = doc(db, 'problems', problemId);
    
    let updates: {[key: string]: any} = {};

    if (currentVote === voteType) { // User is toggling off their vote
      updates[voteType === 'like' ? 'likes' : 'dislikes'] = increment(-1);
      setUserVotes(prev => ({...prev, [problemId]: null}));
    } else { // New vote or changing vote
      if (currentVote) { // Changing vote from like to dislike or vice-versa
        updates[currentVote === 'like' ? 'likes' : 'dislikes'] = increment(-1);
      }
      updates[voteType === 'like' ? 'likes' : 'dislikes'] = increment(1);
      setUserVotes(prev => ({...prev, [problemId]: voteType}));
    }
    
    try {
        await updateDoc(problemDocRef, updates);
    } catch (error) {
        console.error("Error voting on problem:", error);
        // Optionally, revert the local state change
        // For this prototype, we will optimistically update
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
