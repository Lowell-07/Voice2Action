"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProblems } from '@/context/problem-context';
import { ArrowLeft, Building, CalendarDays, Flag, Frown, MapPin, Share, ThumbsDown, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function IssueDetailsPage() {
  const params = useParams();
  const { id } = params;
  const { problems, voteOnProblem } = useProblems();
  
  const problem = problems.find(p => p.id === id);

  if (!problem) {
    return (
        <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12 text-center">
            <Card className="bg-card/80 backdrop-blur-sm border-destructive/50">
                <CardHeader>
                    <Frown className="w-16 h-16 mx-auto text-destructive" />
                    <CardTitle className="text-2xl mt-4">Issue Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                     <Button asChild>
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-6xl mx-auto px-4">
            <div className="mb-8">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card/80 backdrop-blur-sm border-border/20">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                            <Badge variant={problem.status === 'Resolved' ? 'default' : problem.status === 'In Progress' ? 'secondary' : 'outline'}>
                                {problem.status}
                            </Badge>
                               <Badge variant="outline">Priority</Badge>
                               <Badge variant="outline">Infrastructure</Badge>
                            </div>
                            <CardTitle className="text-3xl lg:text-4xl font-headline">{problem.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                            <Share className="w-5 h-5" />
                            </Button>
                             <Button variant="ghost" size="icon">
                            <Flag className="w-5 h-5" />
                            </Button>
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-6">
                           <Image 
                                src={`https://picsum.photos/seed/${problem.media.images[0]}/1200/675`}
                                alt={problem.title}
                                fill
                                className="object-cover"
                                data-ai-hint="issue photo"
                            />
                        </div>
                         <Card className="bg-card/50 backdrop-blur-sm border-border/20">
                            <CardHeader>
                                <CardTitle>Issue Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{problem.description}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 backdrop-blur-sm border-border/20 mt-6">
                           <CardContent className="p-4 flex justify-between items-center">
                               <div className="flex items-center gap-4">
                                   <Button variant="outline" size="lg" onClick={() => voteOnProblem(problem.id, 'like')}>
                                       <ThumbsUp className="w-5 h-5 mr-2" />
                                       {problem.likes}
                                   </Button>
                                   <Button variant="outline" size="lg" onClick={() => voteOnProblem(problem.id, 'dislike')}>
                                       <ThumbsDown className="w-5 h-5 mr-2" />
                                       {problem.dislikes}
                                   </Button>
                               </div>
                               <p className="text-muted-foreground text-sm">{problem.likes + problem.dislikes} total votes</p>
                           </CardContent>
                        </Card>
                    </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className="bg-card/80 backdrop-blur-sm border-border/20">
                    <CardHeader>
                        <CardTitle>Issue Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                            <p className="font-semibold">Location</p>
                            <p className="text-muted-foreground">{problem.location.address}</p>
                        </div>
                        </div>
                         <div className="flex items-start gap-4">
                        <Building className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                            <p className="font-semibold">Department</p>
                            <p className="text-muted-foreground">{problem.department}</p>
                        </div>
                        </div>
                         <div className="flex items-start gap-4">
                        <CalendarDays className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                            <p className="font-semibold">Report ID</p>
                            <p className="text-muted-foreground">{problem.id}</p>
                        </div>
                        </div>
                        <div className="flex justify-between text-sm">
                            <p className="text-muted-foreground">Reported</p>
                            <p>{format(new Date(problem.createdAt), 'PP')}</p>
                        </div>
                         <div className="flex justify-between text-sm">
                            <p className="text-muted-foreground">Last Updated</p>
                            <p>{format(new Date(problem.createdAt), 'PP')}</p>
                        </div>
                    </CardContent>
                    </Card>

                     <Card className="bg-card/80 backdrop-blur-sm border-border/20">
                      <CardHeader>
                        <CardTitle>Status Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-6">
                          <li className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 bg-primary rounded-full" />
                              <div className="w-px h-full bg-border" />
                            </div>
                            <div>
                              <p className="font-semibold">Issue Reported</p>
                              <p className="text-sm text-muted-foreground">{format(new Date(problem.createdAt), 'dd MMMM, yyyy')}</p>
                            </div>
                          </li>
                           <li className="flex gap-4">
                             <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                            </div>
                            <div>
                              <p className="font-semibold">Under Review</p>
                              <p className="text-sm text-muted-foreground">Department assigned and investigating</p>
                            </div>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </main>
  );
}
