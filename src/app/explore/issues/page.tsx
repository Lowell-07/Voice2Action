

'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useProblems } from '@/context/problem-context';
import { Suspense, useMemo } from 'react';

function IssuesPageContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  const department = searchParams.get('department');
  const { problems } = useProblems();

  const filteredProblems = useMemo(() => {
    if (!state || !department) {
      return [];
    }
    return problems.filter(
      (p) => p.location.state === state && p.department === department
    );
  }, [problems, state, department]);

  if (!state || !department) {
    return (
        <div className="container mx-auto max-w-7xl px-6 py-16 text-center">
            <Card className="theme-panel-soft border-destructive/30">
                <CardHeader>
                    <Frown className="w-16 h-16 mx-auto text-destructive" />
                    <CardTitle className="text-2xl mt-4">Invalid Parameters</CardTitle>
                    <CardDescription>
                        State or department is missing. Please go back to the dashboard and select a category.
                    </CardDescription>
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
    <main className="theme-shell flex-1">
      <div className="container mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-6 text-5xl font-headline font-bold text-primary md:text-6xl">
            {department} Issues in {state}
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">
            Showing all reported problems for this category.
          </p>
        </div>

        {filteredProblems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProblems.map((problem) => (
              <Card key={problem.id} className="theme-panel-soft flex flex-col">
                <CardHeader>
                  <div className="relative aspect-video w-full mb-4">
                      <Image 
                        src={problem.media.images[0] || `https://picsum.photos/seed/${problem.id}/600/400`}
                        alt={problem.title}
                        fill
                        className="rounded-md object-cover"
                        data-ai-hint="issue image"
                      />
                  </div>
                  <CardTitle>{problem.title}</CardTitle>
                  <div className="flex justify-between items-center text-sm text-muted-foreground pt-1">
                    <span>{format(new Date(problem.createdAt), 'dd MMM, yyyy')}</span>
                    <Badge variant={problem.status === 'Resolved' ? 'default' : problem.status === 'In Progress' ? 'secondary' : 'outline'}>
                      {problem.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-3">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="theme-panel-soft py-16 text-center">
            <CardHeader>
              <Frown className="w-16 h-16 mx-auto text-muted-foreground" />
              <CardTitle className="mt-4">No Reports Found</CardTitle>
              <CardDescription>There are currently no reports for this department in {state}.</CardDescription>
            </CardHeader>
             <CardContent>
                 <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-12 text-center">
             <Button asChild>
                <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Main Dashboard
                </Link>
            </Button>
        </div>

      </div>
    </main>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={<div className="container max-w-7xl mx-auto px-4 py-8 md:py-12" />}>
      <IssuesPageContent />
    </Suspense>
  );
}
