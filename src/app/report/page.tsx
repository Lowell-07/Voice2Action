
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import ReportForm from './report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ReportProblemPage() {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoaded && user.type !== 'user') {
      router.push('/login');
    }
  }, [user, isAuthLoaded, router]);

  if (!isAuthLoaded || user.type !== 'user') {
    return (
        <div className="theme-shell flex min-h-screen flex-col">
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
    <div className="theme-shell flex min-h-screen flex-col">
      <main className="flex-1 py-8 md:py-12" data-testid="page-report">
        <div className="container mx-auto max-w-4xl px-6 py-8">
            <Card className="theme-panel-soft shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-headline text-primary md:text-5xl">Report a Civic Issue</CardTitle>
                    <CardDescription className="mx-auto max-w-2xl text-lg leading-relaxed">
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
