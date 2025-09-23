
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, LogOut, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProblems } from '@/context/problem-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Problem } from '@/lib/definitions';


type TabFilter = 'active' | 'resolved';

export default function DepartmentDashboardPage() {
  const { user, logout, incrementCivicPoints } = useAuth();
  const router = useRouter();
  const { problems, updateProblem } = useProblems();
  const [tab, setTab] = useState<TabFilter>('active');
  
  useEffect(() => {
    if (user.type !== 'department') {
      router.push('/department/login');
    }
  }, [user, router]);

  const { activeReports, resolvedReports } = useMemo(() => {
    if (user.type !== 'department') return { activeReports: [], resolvedReports: [] };
    
    const reports = problems.filter(p => p.department === user.data.department && ['Registered', 'In Progress', 'Resolved'].includes(p.status));
    
    return {
      activeReports: reports.filter(p => p.status === 'Registered' || p.status === 'In Progress'),
      resolvedReports: reports.filter(p => p.status === 'Resolved'),
    };
  }, [problems, user]);
  
  if (user.type !== 'department') {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className='flex items-center gap-2 text-lg text-muted-foreground'>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusChange = (reportId: string, newStatus: string) => {
    const problem = problems.find(p => p.id === reportId);
    if (problem && problem.status !== 'Resolved' && newStatus === 'Resolved' && problem.reportedById) {
        incrementCivicPoints(problem.reportedById, 5);
    }
    updateProblem(reportId, { status: newStatus as any });
  };
  
  const renderTable = (reports: Problem[]) => (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length > 0 ? reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>{format(new Date(report.createdAt), 'dd MMM, yyyy')}</TableCell>
            <TableCell className="font-medium">{report.title}</TableCell>
            <TableCell>
              <Badge variant={report.status === 'Resolved' ? 'default' : report.status === 'In Progress' ? 'secondary' : 'outline'}>
                {report.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
               <div className="flex items-center justify-end gap-2">
                  <Select defaultValue={report.status} onValueChange={(value) => handleStatusChange(report.id, value)}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Registered">Registered</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                    No issues found in this category.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-7xl mx-auto px-4">
            <div className='text-center mb-12'>
              <h1 className="text-4xl md:text-5xl font-headline text-foreground">{user.data.department} Dashboard</h1>
              <p className="text-muted-foreground mt-2">Review and manage reported issues for your department.</p>
            </div>

          <Card className="shadow-xl bg-card/50 backdrop-blur-sm border-border/20">
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <div>
                        <CardTitle>Reported Issues for {user.data.department}</CardTitle>
                        <CardDescription>Here are all the issues assigned to your department.</CardDescription>
                    </div>
                     <Button variant="outline" size="sm" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={tab} onValueChange={(value) => setTab(value as TabFilter)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active Issues</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved Issues</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-4">
                        {renderTable(activeReports)}
                    </TabsContent>
                     <TabsContent value="resolved" className="mt-4">
                        {renderTable(resolvedReports)}
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
