
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Phone, Edit, UserCircle, ArrowLeft, Lightbulb, FileText, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockProblems } from '@/lib/data';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const departmentIcons: { [key: string]: React.ReactNode } = {
  'Electricity Department': <Lightbulb className="w-5 h-5 text-muted-foreground" />,
  'Default': <FileText className="w-5 h-5 text-muted-foreground" />,
};

const getIconForDepartment = (department: string) => {
    return departmentIcons[department] || departmentIcons['Default'];
}


export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
  
  const userProblems = mockProblems.filter(p => p.reportedBy.id === user.data.id);
  const resolvedCount = userProblems.filter(p => p.status === 'Resolved').length;
  const pendingCount = userProblems.filter(p => p.status === 'Pending').length;
  const inProgressCount = userProblems.filter(p => p.status === 'In Progress').length;
  const totalReported = userProblems.length;

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-5xl mx-auto px-4 space-y-12">
            
            <div className="flex justify-between items-center">
                <div className='text-center md:text-left'>
                    <div className='flex items-center gap-4 justify-center md:justify-start mb-4'>
                        <UserCircle className='w-12 h-12 text-foreground'/>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-headline font-bold">User Profile</h1>
                            <p className="text-muted-foreground">Manage your Voice2Action account and preferences</p>
                        </div>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                </Button>
            </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/20">
            <CardHeader className='flex-row justify-between items-center'>
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic account details.</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <Edit className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg font-semibold">{user.data.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{user.data.email || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="text-lg font-semibold">{`+91${user.data.mobile}`}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">State/UT</p>
                <p className="text-lg font-semibold">Delhi</p>
              </div>
            </CardContent>
          </Card>
          
          <div>
            <div className='mb-6'>
                <h2 className="text-2xl font-headline font-bold">Your Activity</h2>
                <p className="text-muted-foreground">Summary of your civic engagement</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/20 text-center p-6">
                <p className="text-5xl font-bold text-primary">{totalReported}</p>
                <p className="text-sm text-muted-foreground mt-2">Issues Reported</p>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/20 text-center p-6">
                <p className="text-5xl font-bold text-green-500">{resolvedCount}</p>
                 <p className="text-sm text-muted-foreground mt-2">Issues Resolved</p>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/20 text-center p-6">
                <p className="text-5xl font-bold text-red-500">{pendingCount + inProgressCount}</p>
                 <p className="text-sm text-muted-foreground mt-2">Pending Issues</p>
              </Card>
            </div>
          </div>

          <div>
             <div className='mb-6 mt-12'>
                <h2 className="text-2xl font-headline font-bold">Recent Reports</h2>
                <p className="text-muted-foreground">Your latest civic issue reports</p>
            </div>
            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
                <CardContent className="p-0">
                    <div className="space-y-4">
                        {userProblems.map((problem, index) => (
                            <div key={problem.id} className={`flex items-center justify-between p-4 ${index < userProblems.length - 1 ? 'border-b border-border/50' : ''}`}>
                                <div className="flex items-center gap-4">
                                    {getIconForDepartment(problem.department)}
                                    <div>
                                        <p className="font-semibold">{problem.title}</p>
                                        <p className="text-sm text-muted-foreground">Reported {format(new Date(problem.createdAt), 'dd MMM, yyyy')}</p>
                                    </div>
                                </div>
                                <Badge variant={problem.status === 'Resolved' ? 'default' : problem.status === 'In Progress' ? 'secondary' : 'outline'}>
                                    {problem.status === 'Pending' ? 'Awaiting Approval' : problem.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </div>

          <div>
             <div className='mb-6 mt-12'>
                <h2 className="text-2xl font-headline font-bold">Preferences</h2>
                <p className="text-muted-foreground">Customize your Voice2Action experience</p>
            </div>
            <Card className="bg-card/50 backdrop-blur-sm border-border/20">
                <CardContent className="p-6 space-y-6">
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
                <CardFooter className='justify-end'>
                    <Button variant="destructive" onClick={logout}>Logout</Button>
                </CardFooter>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
