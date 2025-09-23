
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Check, X, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from 'date-fns';
import { useProblems } from '@/context/problem-context';
import type { Problem } from '@/lib/definitions';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { problems, updateProblem } = useProblems();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const pendingReports = useMemo(() => {
    return problems.filter(p => p.status === 'Awaiting Approval');
  }, [problems]);

  useEffect(() => {
    if (user.type !== 'admin') {
      router.push('/admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [user, router]);
  
  const handleApproval = (id: string, approved: boolean) => {
    const newStatus = approved ? 'Registered' : 'Rejected';
    updateProblem(id, { status: newStatus as Problem['status'] });
    toast({
        title: `Report ${approved ? 'Approved' : 'Rejected'}`,
        description: `The report has been processed.`,
    })
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className='flex items-center gap-2 text-lg text-muted-foreground'>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Verifying authorization...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-7xl mx-auto px-4">
            <div className='text-center mb-12'>
              <h1 className="text-4xl md:text-5xl font-headline text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Review and validate reported civic issues.</p>
            </div>

          <Card className="shadow-xl bg-card/50 backdrop-blur-sm border-border/20">
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <div>
                        <CardTitle>All Reported Issues</CardTitle>
                        <CardDescription>Here are all the issues that have been reported by users. Click a row to see details.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReports.length > 0 ? pendingReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{format(new Date(report.createdAt), 'dd MMM, yyyy')}</TableCell>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{report.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Awaiting Approval</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleApproval(report.id, true)}>
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleApproval(report.id, false)} className="text-red-500">
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                All Caught Up! No pending reports.
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
