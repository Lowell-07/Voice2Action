
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useProblems } from '@/context/problem-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, MapPin, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Problem } from '@/lib/definitions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function MyReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { problems, voteOnProblem } = useProblems();
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  useEffect(() => {
    if (user.type !== 'user') {
      router.push('/login');
    }
  }, [user, router]);

  if (user.type !== 'user') {
    return (
      <div className="theme-shell flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className='flex items-center gap-2 text-lg text-muted-foreground'>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  const userProblems = problems.filter(p => p.reportedBy.id === user.data.id);
  
  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Resolved': return 'default';
        case 'In Progress': return 'secondary';
        case 'Awaiting Approval':
        case 'Registered':
             return 'outline';
        default: return 'destructive';
    }
  };

  return (
    <>
    <div className="theme-shell flex min-h-screen flex-col">
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8">
            <Button asChild variant="ghost" size="sm">
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Link>
            </Button>
          </div>

          <Card className="theme-panel-soft shadow-xl">
            <CardHeader>
              <CardTitle>My Reported Issues</CardTitle>
              <CardDescription>A complete history of all the civic issues you have reported.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userProblems.length > 0 ? userProblems.map((problem) => (
                    <TableRow key={problem.id} onClick={() => setSelectedProblem(problem)} className="cursor-pointer">
                      <TableCell>{format(new Date(problem.createdAt), 'dd MMM, yyyy')}</TableCell>
                      <TableCell className="font-medium">{problem.title}</TableCell>
                      <TableCell>{problem.department}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(problem.status)}>{problem.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        You haven't reported any issues yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
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
                        <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-4">
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
