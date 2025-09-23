

"use client";

import { createContext, useState, ReactNode, useMemo, useContext, useCallback, useEffect } from 'react';
import type { Problem } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, increment, getDocs, writeBatch } from 'firebase/firestore';
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

const sampleProblems: Omit<Problem, 'id' | 'createdAt' | 'reportedById' | 'reportedBy'>[] = [
    {
        title: 'Broken Streetlight on Park Avenue',
        description: 'The streetlight at the corner of Park Avenue and 12th Street has been out for a week. It is very dark at night and feels unsafe.',
        department: 'Electric Department',
        issueType: 'Broken Streetlight',
        status: 'Registered',
        location: {
            address: 'Park Avenue & 12th St, Delhi',
            state: 'Delhi',
            city: 'Delhi',
            coordinates: { lat: 28.6139, lng: 77.2090 },
        },
        media: { images: [`https://picsum.photos/seed/streetlight-sample/600/400`], videos: [] },
        likes: 5,
        dislikes: 0,
    },
    {
        title: 'Garbage Overflow near Central Market',
        description: 'The community garbage bins near Central Market are overflowing. This is attracting stray animals and causing a foul smell.',
        department: 'Municipal Department',
        issueType: 'Waste Management',
        status: 'In Progress',
        location: {
            address: 'Central Market, Bangalore',
            state: 'Karnataka',
            city: 'Bangalore',
            coordinates: { lat: 12.9716, lng: 77.5946 },
        },
        media: { images: [`https://picsum.photos/seed/garbage-sample/600/400`], videos: [] },
        likes: 12,
        dislikes: 1,
    },
    {
        title: 'Leaking Water Pipe',
        description: 'A water pipe on the main road of the Jubilee Hills area has been leaking for three days, wasting a lot of water.',
        department: 'Water & Sewerage',
        issueType: 'Water Leakage',
        status: 'Awaiting Approval',
        location: {
            address: 'Jubilee Hills, Hyderabad',
            state: 'Telangana',
            city: 'Hyderabad',
            coordinates: { lat: 17.4334, lng: 78.4063 },
        },
        media: { images: [`https://picsum.photos/seed/water-sample/600/400`], videos: [] },
        likes: 2,
        dislikes: 0,
    }
];

async function seedDatabaseIfNeeded() {
    const problemsCollection = collection(db, 'problems');
    const snapshot = await getDocs(problemsCollection);
    if (snapshot.empty) {
        console.log("Database is empty, seeding sample problems...");
        const batch = writeBatch(db);
        sampleProblems.forEach(problemData => {
            const newDocRef = doc(problemsCollection);
            const fullProblemData = {
                ...problemData,
                createdAt: new Date().toISOString(),
                reportedById: 'system-seed',
                reportedBy: {
                    id: 'system',
                    name: 'System',
                    avatarUrl: '',
                },
            };
            batch.set(newDocRef, fullProblemData);
        });
        await batch.commit();
        console.log("Seeding complete.");
    } else {
        console.log("Database not empty, skipping seed.");
    }
}


export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const { user } = useAuth();

  useEffect(() => {
    // Seed database on initial load if empty
    seedDatabaseIfNeeded();

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
