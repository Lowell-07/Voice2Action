
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type StatusFilter = 'Awaiting Approval' | 'Registered' | 'Rejected';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { problems, updateProblem } = useProblems();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Awaiting Approval');

  const filteredReports = useMemo(() => {
    return problems.filter(p => p.status === statusFilter);
  }, [problems, statusFilter]);

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

  const getBadgeVariant = (status: Problem['status']) => {
    switch (status) {
      case 'Registered':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!isAuthorized) {
    return (
      <div className="theme-shell flex min-h-screen flex-col">
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
    <div className="theme-shell flex min-h-screen flex-col">
      <main className="flex-1 py-8 md:py-12" data-testid="page-admin-dashboard">
        <div className="container mx-auto max-w-7xl px-6 py-8">
            <div className='mb-12 text-center'>
              <h1 className="text-5xl font-headline text-primary md:text-6xl">Admin Dashboard</h1>
              <p className="mt-3 text-lg text-muted-foreground">Review and validate reported civic issues.</p>
            </div>

          <Card className="theme-panel-soft shadow-xl">
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <div>
                        <CardTitle>All Reported Issues</CardTitle>
                        <CardDescription>Review, approve, or reject issues submitted by users.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Awaiting Approval">Awaiting Approval</TabsTrigger>
                  <TabsTrigger value="Registered">Approved</TabsTrigger>
                  <TabsTrigger value="Rejected">Rejected</TabsTrigger>
                </TabsList>
                <TabsContent value={statusFilter}>
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
                      {filteredReports.length > 0 ? filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{format(new Date(report.created_at), 'dd MMM, yyyy')}</TableCell>
                          <TableCell className="font-medium">{report.title}</TableCell>
                          <TableCell>{report.department}</TableCell>
                          <TableCell>
                            <Badge variant={getBadgeVariant(report.status)}>{report.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             {report.status === 'Awaiting Approval' && (
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
                                    <DropdownMenuItem onClick={() => handleApproval(report.id, false)} className="text-destructive">
                                      <X className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                             )}
                          </TableCell>
                        </TableRow>
                      )) : (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                  No reports with status "{statusFilter}".
                              </TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
