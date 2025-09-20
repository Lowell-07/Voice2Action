"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Check, X, UserCircle, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockProblems } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reports, setReports] = useState(mockProblems.filter(p => p.status === 'Pending'));

  useEffect(() => {
    if (user.type !== 'admin') {
      router.push('/admin/login');
    }
  }, [user, router]);
  
  const handleApproval = (id: string, approved: boolean) => {
    setReports(reports.filter(r => r.id !== id));
    toast({
        title: `Report ${approved ? 'Approved' : 'Rejected'}`,
        description: `The report has been processed.`,
    })
  }

  if (user.type !== 'admin') {
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
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-headline text-primary">Admin Dashboard</CardTitle>
              <CardDescription className="text-lg">Review and approve new reports from users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {reports.length > 0 ? reports.map((report, index) => (
                    <div key={report.id}>
                        <Card className='bg-background'>
                            <CardHeader>
                                <CardTitle>{report.title}</CardTitle>
                                <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                                    <span className='flex items-center gap-1'><UserCircle className='w-4 h-4'/>{report.reportedBy.name}</span>
                                    <span className='flex items-center gap-1'><MapPin className='w-4 h-4'/>{report.location.city}, {report.location.state}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p>{report.description}</p>
                                <Badge variant="outline" className='mt-4'>{report.department}</Badge>
                            </CardContent>
                            <CardFooter className='flex justify-end gap-2'>
                                <Button variant="destructive" size="sm" onClick={() => handleApproval(report.id, false)}>
                                    <X className="w-4 h-4 mr-2" /> Reject
                                </Button>
                                <Button size="sm" onClick={() => handleApproval(report.id, true)}>
                                    <Check className="w-4 h-4 mr-2" /> Approve
                                </Button>
                            </CardFooter>
                        </Card>
                        {index < reports.length - 1 && <Separator className='my-6' />}
                    </div>
                )) : (
                    <div className='text-center py-16'>
                        <h3 className='text-xl font-semibold'>All Caught Up!</h3>
                        <p className='text-muted-foreground'>There are no pending reports to review.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}