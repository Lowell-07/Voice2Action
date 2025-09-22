
'use client';

import { useParams } from 'next/navigation';
import { useProblems } from '@/context/problem-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Loader2, Frown, ThumbsUp, ThumbsDown, MapPin, Building, CalendarDays, Share, Flag } from 'lucide-react';
import { format } from 'date-fns';

export default function IssueDetailPage() {
  const params = useParams();
  const { problems, voteOnProblem } = useProblems();
  const id = params.id as string;

  const problem = problems.find((p) => p.id === id);

  if (!problem) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)] items-center justify-center text-center">
        <Frown className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Issue Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The issue you are looking for does not exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 py-8 md:py-12">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-8">
            <Button variant="outline" asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
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
                    <CardTitle className="text-3xl font-headline">{problem.title}</CardTitle>
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
                <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                   <Image 
                        src={`https://picsum.photos/seed/${problem.media.images[0]}/1200/675`}
                        alt={problem.title}
                        fill
                        className="object-cover"
                        data-ai-hint="issue photo"
                    />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
              <CardHeader>
                <CardTitle>Issue Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
             <Card className="bg-card/50 backdrop-blur-sm border-border/20">
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
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
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
                    <p>{format(new Date(problem.createdAt), 'dd/MM/yyyy')}</p>
                </div>
                 <div className="flex justify-between text-sm">
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{format(new Date(problem.createdAt), 'dd/MM/yyyy')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
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
                      <p className="text-sm text-muted-foreground">{format(new Date(problem.createdAt), 'dd/MM/yyyy')}</p>
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
