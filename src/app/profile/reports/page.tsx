
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useProblems } from '@/context/problem-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function MyReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { problems } = useProblems();

  useEffect(() => {
    if (user.type !== 'user') {
      router.push('/login');
    }
  }, [user, router]);

  if (user.type !== 'user') {
    return (
      <div className="flex flex-col min-h-screen">
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
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Button asChild variant="ghost" size="sm">
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Link>
            </Button>
          </div>

          <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20">
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
                    <TableRow key={problem.id} onClick={() => router.push(`/explore/issues/${problem.id}`)} className="cursor-pointer">
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
  );
}
