
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Phone, Edit, UserCircle, ArrowLeft, Settings, LogOut, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useProblems } from '@/context/problem-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';


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
  const resolvedCount = userProblems.filter(p => p.status === 'Resolved').length;
  const totalReported = userProblems.length;
  const rating = totalReported > 0 ? ((resolvedCount / totalReported) * 5).toFixed(1) : 'N/A';

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-2xl mx-auto px-4 space-y-8">
            
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-headline font-bold">Profile</h1>
            </div>

            <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-24 w-24 border-4 border-primary">
                    {user.data.avatarUrl && <AvatarImage src={user.data.avatarUrl} alt={user.data.name} />}
                    <AvatarFallback className="text-4xl">
                        {user.data.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-3xl font-bold">{user.data.name}</h2>
                <p className="text-muted-foreground">Civic Contributor</p>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-semibold">{user.data.email || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-semibold">{`+91 ${user.data.mobile}`}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-semibold">Delhi, India</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
                <CardHeader>
                    <CardTitle>Activity Stats</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around text-center">
                    <div>
                        <p className="text-3xl font-bold text-primary">{totalReported}</p>
                        <p className="text-sm text-muted-foreground">Reports</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-green-500">{resolvedCount}</p>
                        <p className="text-sm text-muted-foreground">Resolved</p>
                    </div>
                     <div>
                        <p className="text-3xl font-bold text-yellow-400">{rating}</p>
                        <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-6">
                        <Edit className="w-5 h-5 text-muted-foreground" />
                        <span>Edit Profile</span>
                    </Button>
                </CardContent>
            </Card>
            
             <Card className="bg-card/50 backdrop-blur-sm border-border/20">
                <CardHeader>
                    <CardTitle>Settings & Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive updates on your reports</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">SMS Alerts</p>
                            <p className="text-sm text-muted-foreground">Get SMS updates on issue resolution</p>
                        </div>
                        <Switch />
                    </div>
                    <Separator />
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Public Profile</p>
                            <p className="text-sm text-muted-foreground">Make your contributions visible to others</p>
                        </div>
                        <Switch defaultChecked/>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="destructive" onClick={logout} className="w-full gap-2">
                        <LogOut />
                        Logout
                    </Button>
                </CardFooter>
            </Card>

        </div>
      </main>
    </div>
  );
}
