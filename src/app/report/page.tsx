
"use client";

import { useAuth } from '@/hooks/use-auth';
import ReportForm from './report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function ReportProblemPage() {
  const { user } = useAuth();
  const isCitizenLoggedIn = user.type === 'user';

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

                    <div className="mt-4 flex justify-center">
                      {isCitizenLoggedIn ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          <UserCheck className="h-4 w-4" />
                          <span>Reporting as <strong>{user.data.name}</strong> ({user.data.civic_points || 0} Civic Points)</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-muted-foreground">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span>Reporting directly as Citizen.</span>
                          <Link href="/login" className="font-semibold text-primary underline underline-offset-2 hover:opacity-80">
                            Sign in to track points
                          </Link>
                        </div>
                      )}
                    </div>
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
