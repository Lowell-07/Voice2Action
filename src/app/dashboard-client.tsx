"use client";

import { useState } from 'react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { indianStates, mockProblems } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, FileVideo, Mic, PictureInPicture } from 'lucide-react';

export default function DashboardClient() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const problemsInState = selectedState
    ? mockProblems.filter((p) => p.location.state === selectedState)
    : [];

  const solvedProblems = problemsInState.filter(p => p.status === 'Resolved').length;
  const reportedProblems = problemsInState.length;

  const departmentCategories = problemsInState.reduce((acc, problem) => {
    const { department } = problem;
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(problem);
    return acc;
  }, {} as Record<string, typeof mockProblems>);

  const displayedProblems = showAll ? problemsInState : problemsInState.slice(0, 3);

  return (
    <main className="flex-1">
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">
            Track Civic Issues in Your State
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Select a state to see reported problems, their status, and contribute to making your community better.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <p className="text-center font-semibold text-lg mb-4">Search for a state in India</p>
              <Select onValueChange={setSelectedState}>
                <SelectTrigger className="w-full h-12 text-lg">
                  <SelectValue placeholder="Select a state..." />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state.code} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {selectedState && (
          <div className="space-y-12">
            <Card className="bg-secondary/50">
                <CardHeader>
                    <CardTitle className='font-headline text-3xl text-center'>{selectedState}</CardTitle>
                </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                  <div className="bg-card p-6 rounded-lg shadow">
                    <h3 className="text-4xl font-bold text-primary">{reportedProblems}</h3>
                    <p className="text-muted-foreground">Total Problems Reported</p>
                  </div>
                  <div className="bg-card p-6 rounded-lg shadow">
                    <h3 className="text-4xl font-bold text-accent">{solvedProblems}</h3>
                    <p className="text-muted-foreground">Problems Solved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.entries(departmentCategories).map(([department, problems]) => (
                 <div key={department}>
                    <h2 className="text-2xl font-headline font-bold mb-6 border-b-2 border-primary pb-2">{department}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {problems.map((problem) => (
                            <Card key={problem.id} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                                <CardHeader>
                                    <div className="relative w-full h-48">
                                        <Image src={`https://picsum.photos/seed/${problem.media.images[0]}/600/400`} alt={problem.title} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint="issue report" />
                                    </div>
                                    <CardTitle className="pt-4">{problem.title}</CardTitle>
                                    <CardDescription>{new Date(problem.createdAt).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground line-clamp-2">{problem.description}</p>
                                    <div className="flex gap-2 mt-4">
                                        {problem.media.images.length > 0 && <Badge variant="secondary"><PictureInPicture className="w-3 h-3 mr-1" /> Photo</Badge>}
                                        {problem.media.videos.length > 0 && <Badge variant="secondary"><FileVideo className="w-3 h-3 mr-1" /> Video</Badge>}
                                        {problem.media.voicemail && <Badge variant="secondary"><Mic className="w-3 h-3 mr-1" /> Voice</Badge>}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                     <Badge variant={problem.status === 'Resolved' ? 'default' : problem.status === 'In Progress' ? 'outline' : 'destructive'} className='bg-accent text-accent-foreground'>
                                        {problem.status === 'Resolved' && <CheckCircle className="w-4 h-4 mr-1" />}
                                        {problem.status !== 'Resolved' && <Clock className="w-4 h-4 mr-1" />}
                                        {problem.status}
                                    </Badge>
                                    <Button variant="ghost" size="sm">View Details <ArrowRight className="w-4 h-4 ml-2" /></Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                    <Link href="/report">Report Another Problem</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="/profile">View Your Progress</Link>
                </Button>
            </div>
        </div>
      </div>
    </main>
  );
}
