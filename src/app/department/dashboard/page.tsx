"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Loader2, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockProblems } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DepartmentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState(
    mockProblems.filter(p => p.department === 'Public Works Department' && p.status !== 'Resolved')
  );
  
  useEffect(() => {
    if (user.type !== 'department') {
      router.push('/department/login');
    }
  }, [user, router]);
  
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

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-headline text-primary">{user.data.department} Dashboard</CardTitle>
              <CardDescription className="text-lg">View and manage active reports for your department.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription className='flex items-center gap-1'><MapPin className='w-4 h-4'/>{report.location.city}, {report.location.state}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{report.description}</p>
                  </CardContent>
                  <CardFooter className='flex justify-between items-center'>
                    <p className='text-sm text-muted-foreground'>Status: <span className='font-semibold text-foreground'>{report.status}</span></p>
                    <div className="flex items-center gap-2">
                      <Select defaultValue={report.status}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm">Update</Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
