
"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { indianStates } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe, MapPin, Calendar, ThumbsUp, ThumbsDown, Building, Flag, Share } from 'lucide-react';
import { useProblems } from '@/context/problem-context';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Problem } from '@/lib/definitions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardClient() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const { problems, voteOnProblem } = useProblems();

  const problemsInState = useMemo(() => {
    if (!selectedState) return [];
    return problems
      .filter((p) => p.location.state === selectedState)
      .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
  }, [selectedState, problems]);
  
  const stateProblemCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    for (const state of indianStates) {
        counts[state.name] = 0;
    }
    for (const problem of problems) {
        if (counts[problem.location.state] !== undefined) {
            counts[problem.location.state]++;
        }
    }
    return counts;
  }, [problems]);

  return (
    <>
    <main className="flex-1">
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Track civic issues and progress across states. Select your state to explore local accountability data.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
             <CardHeader className="flex-row items-center gap-4">
                <Globe className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle className="text-xl">Select Your State or Union Territory</CardTitle>
                    <CardDescription>Choose from {indianStates.length} states and union territories to view local civic issues.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
              <Select onValueChange={setSelectedState} value={selectedState || ""}>
                <SelectTrigger className="w-full h-12 text-lg bg-background/50">
                  <SelectValue placeholder="Select a State" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state.code} value={state.name}>
                        <div className="flex justify-between w-full">
                            <span>{state.name}</span>
                            <span className="text-muted-foreground ml-4">{stateProblemCounts[state.name]} reports</span>
                        </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
        
        {selectedState && (
             <div>
                <div className="flex items-center gap-3 mb-8">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <h2 className="text-3xl font-headline font-bold">Trending Issues in {selectedState}</h2>
                </div>
                {problemsInState.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {problemsInState.map((problem) => (
                        <Card key={problem.id} className="bg-card/80 backdrop-blur-sm border-border/20 flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="relative aspect-video w-full">
                                <Image 
                                    src={problem.media.images[0] || `https://picsum.photos/seed/${problem.id}/600/400`}
                                    alt={problem.title}
                                    fill
                                    className="object-cover"
                                    data-ai-hint="issue image"
                                />
                                <Badge className="absolute top-2 right-2" variant={problem.status === 'Resolved' ? 'default' : problem.status === 'In Progress' ? 'secondary' : 'destructive'}>
                                    {problem.status === 'Pending' || problem.status === 'Awaiting Approval' ? 'New' : problem.status}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl leading-tight">{problem.title}</CardTitle>
                                <div className="flex items-center text-xs text-muted-foreground gap-4 pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3" />
                                        <span>{problem.location.address}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        <span>{format(new Date(problem.createdAt), 'dd/MM/yyyy')}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-2">{problem.description}</p>
                                <div className="flex items-center text-xs text-muted-foreground gap-2 pt-3">
                                    <Building className="w-3 h-3" />
                                    <span>{problem.department}</span>
                                    <span>#{problem.id.split('-')[1]}</span>
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => voteOnProblem(problem.id, 'like')}>
                                        <ThumbsUp className="w-4 h-4 mr-2" />
                                        {problem.likes}
                                    </Button>
                                     <Button variant="outline" size="sm" onClick={() => voteOnProblem(problem.id, 'dislike')}>
                                        <ThumbsDown className="w-4 h-4 mr-2" />
                                        {problem.dislikes}
                                    </Button>
                                </div>
                                <Button variant="secondary" onClick={() => setSelectedProblem(problem)}>
                                    View Details
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
                 ) : (
                <Card className="bg-card/80 backdrop-blur-sm border-border/20 text-center py-16">
                    <CardHeader>
                        <CardTitle>No Issues Found</CardTitle>
                        <CardDescription>There are no reported issues for {selectedState} yet.</CardDescription>
                    </CardHeader>
                </Card>
            )}
            </div>
        )}

      </div>
    </main>

    <Dialog open={!!selectedProblem} onOpenChange={(isOpen) => !isOpen && setSelectedProblem(null)}>
        <DialogContent className="sm:max-w-2xl">
            {selectedProblem && (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-headline">{selectedProblem.title}</DialogTitle>
                         <div className="flex items-center gap-3 pt-2">
                            <Badge variant={selectedProblem.status === 'Resolved' ? 'default' : selectedProblem.status === 'In Progress' ? 'secondary' : 'outline'}>
                                {selectedProblem.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{selectedProblem.department}</span>
                        </div>
                    </DialogHeader>
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                           <Image 
                                src={selectedProblem.media.images[0] || `https://picsum.photos/seed/${selectedProblem.id}/1200/675`}
                                alt={selectedProblem.title}
                                fill
                                className="object-cover"
                                data-ai-hint="issue photo"
                            />
                        </div>
                        <p className="text-muted-foreground">{selectedProblem.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-semibold">Location</p>
                                    <p className="text-muted-foreground">{selectedProblem.location.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-semibold">Reported On</p>
                                    <p className="text-muted-foreground">{format(new Date(selectedProblem.createdAt), 'PP')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                           <div className="flex items-center gap-4">
                               <Button variant="outline" onClick={() => voteOnProblem(selectedProblem.id, 'like')}>
                                   <ThumbsUp className="w-4 h-4 mr-2" />
                                   {selectedProblem.likes}
                               </Button>
                               <Button variant="outline" onClick={() => voteOnProblem(selectedProblem.id, 'dislike')}>
                                   <ThumbsDown className="w-4 h-4 mr-2" />
                                   {selectedProblem.dislikes}
                               </Button>
                           </div>
                           <p className="text-muted-foreground text-sm">{selectedProblem.likes + selectedProblem.dislikes} total votes</p>
                        </div>
                    </div>
                </>
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}
