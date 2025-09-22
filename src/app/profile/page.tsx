
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Phone, Edit, Settings, ArrowLeft, MapPin, Star, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useProblems } from '@/context/problem-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
  const resolvedProblems = userProblems.filter(p => p.status === 'Resolved').length;

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-2xl mx-auto px-4">
            
            <div className='mb-8'>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            
            <div className='text-center mb-8'>
                <h1 className="text-2xl font-bold mb-4">Profile</h1>
                 <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary">
                    {user.data.avatarUrl && <AvatarImage src={user.data.avatarUrl} alt={user.data.name} />}
                    <AvatarFallback className="text-4xl">{user.data.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-3xl font-bold font-headline">{user.data.name}</h2>
                <p className="text-muted-foreground">Civic Contributor</p>
            </div>

            <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20 mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-4">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p>{user.data.email || 'No email provided'}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                         <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p>{user.data.mobile}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                         <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p>New York, NY</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20 mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Activity Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 divide-x divide-border/50 text-center">
                    <div className="p-4">
                        <p className="text-3xl font-bold text-primary">{userProblems.length}</p>
                        <p className="text-sm text-muted-foreground">Reports</p>
                    </div>
                    <div className="p-4">
                        <p className="text-3xl font-bold text-primary">{resolvedProblems}</p>
                        <p className="text-sm text-muted-foreground">Resolved</p>
                    </div>
                     <div className="p-4">
                        <p className="text-3xl font-bold text-primary">4.8</p>
                        <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-border/20">
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/profile/edit">
                            <Edit className="mr-3 h-4 w-4" /> Edit Profile
                        </Link>
                    </Button>
                     <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/profile/settings">
                            <Settings className="mr-3 h-4 w-4" /> Settings & Preferences
                        </Link>
                    </Button>
                </CardContent>
            </Card>

        </div>
      </main>
    </div>
  );
}
