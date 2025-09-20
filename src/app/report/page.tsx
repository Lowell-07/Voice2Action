"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import ReportForm from './report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ReportProblemPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user.type === 'guest') {
      router.push('/login');
    }
  }, [user, router]);

  if (user.type === 'guest') {
    return (
        <div className="flex flex-col min-h-screen">
        <Header />
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
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-4xl mx-auto px-4">
            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-headline text-primary">Report a Civic Issue</CardTitle>
                    <CardDescription className="text-lg">
                        Help improve your community by reporting problems. Fill out the details below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReportForm />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
