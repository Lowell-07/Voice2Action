
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Phone, Edit, UserCircle, ArrowLeft, Settings, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useProblems } from '@/context/problem-context';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { problems } = useProblems();

  useEffect(() => {
    if (user.type === 'guest') {
      router.push('/login');
    }
  }, [user, router]);

  if (user.type !== 'user') {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
            <div className='flex items-center gap-2 text-lg text-muted-foreground'>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading Profile...</span>
            </div>
        </div>
      </div>
    );
  }
  
  const userProblems = problems.filter(p => p.reportedBy.id === user.data.id);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-4xl mx-auto px-4">
            <div className='text-center mb-12'>
              <h1 className="text-4xl md:text-5xl font-headline text-primary">Your Profile</h1>
              <p className="text-muted-foreground mt-2">View your reported issues and manage your account.</p>
            </div>

            <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20 mb-8">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className='flex items-center gap-4'>
                        <UserCircle className="h-16 w-16 text-primary" />
                        <div>
                            <CardTitle className="text-2xl">{user.data.name}</CardTitle>
                            <CardDescription>Civic Reporter</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>{user.data.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>{user.data.mobile}</span>
                    </div>
                </CardContent>
            </Card>

             <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20 mb-8">
                <CardHeader>
                    <CardTitle>Your Reported Issues ({userProblems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {userProblems.length > 0 ? (
                        <ul className="space-y-4">
                            {userProblems.map(p => (
                                <li key={p.id} className="flex justify-between items-center p-4 bg-background/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{p.title}</p>
                                        <p className="text-sm text-muted-foreground">{p.department} - Status: {p.status}</p>
                                    </div>
                                    <Button variant="secondary" size="sm" asChild>
                                        <Link href={`/explore/issues/${p.id}`}>View</Link>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">You have not reported any issues yet.</p>
                    )}
                </CardContent>
            </Card>
            
            <div className="flex justify-between items-start gap-8">
                <div className="w-full">
                    <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20">
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" /> Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="w-full">
                     <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20">
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" className="w-full justify-start" onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
        </div>
      </main>
    </div>
  );
}
