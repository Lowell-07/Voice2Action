"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Loader2, Mail, Phone, Edit, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockProblems } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user.type === 'guest') {
      router.push('/login');
    }
  }, [user, router]);

  if (user.type !== 'user') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
            <div className='flex items-center gap-2 text-lg text-muted-foreground'>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading Profile...</span>
            </div>
        </div>
      </div>
    );
  }
  
  const userProblems = mockProblems.filter(p => p.reportedBy.id === user.data.id);
  const resolvedCount = userProblems.filter(p => p.status === 'Resolved').length;
  const pendingCount = userProblems.filter(p => p.status === 'Pending').length;
  const inProgressCount = userProblems.filter(p => p.status === 'In Progress').length;
  const totalReported = userProblems.length;

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-7xl mx-auto px-4 space-y-12">
          
          {/* User Profile Card */}
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary">
                <AvatarImage src={user.data.avatarUrl} alt={user.data.name} />
                <AvatarFallback>{user.data.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">{user.data.name}</h1>
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-muted-foreground mt-2">
                  <span className="flex items-center justify-center md:justify-start gap-2"><Phone className="w-4 h-4"/> {user.data.mobile}</span>
                  {user.data.email && <span className="flex items-center justify-center md:justify-start gap-2"><Mail className="w-4 h-4"/> {user.data.email}</span>}
                </div>
              </div>
              <Button variant="outline"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
            </CardContent>
          </Card>
          
          {/* Activity Board */}
          <div>
            <h2 className="text-2xl font-headline font-bold mb-4">Your Activity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reported</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalReported}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Loader2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inProgressCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{resolvedCount}</div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Reports Posted by User */}
           <div>
            <h2 className="text-2xl font-headline font-bold mb-4">Your Reports</h2>
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-4">
                        {userProblems.length > 0 ? userProblems.map((problem, index) => (
                            <div key={problem.id}>
                                <div className="p-4 flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className='flex gap-4 items-start'>
                                        <div className="relative w-24 h-24 flex-shrink-0">
                                            <Image src={`https://picsum.photos/seed/${problem.media.images[0]}/200/200`} alt={problem.title} layout="fill" objectFit="cover" className="rounded-md" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg mb-1">{problem.title}</CardTitle>
                                            <CardDescription>
                                                {problem.location.city}, {problem.location.state} &bull; {new Date(problem.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{problem.description}</p>
                                        </div>
                                    </div>
                                    <Badge variant={problem.status === 'Resolved' ? 'default' : problem.status === 'In Progress' ? 'outline' : 'destructive'} className='bg-accent text-accent-foreground mt-2 md:mt-0 flex-shrink-0'>
                                        {problem.status}
                                    </Badge>
                                </div>
                                {index < userProblems.length - 1 && <Separator />}
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-center p-8">You haven't reported any problems yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
           </div>
        </div>
      </main>
    </div>
  );
}
