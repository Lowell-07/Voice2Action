
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Phone, Edit, Settings, ArrowLeft, MapPin, Star, FileText, AlertTriangle, BadgeCheck, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useProblems } from '@/context/problem-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { problems, deleteProblem } = useProblems();
  const [problemToDelete, setProblemToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

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
  
  const userProblems = problems.filter(p => String(p.reportedBy?.id) === String(user.data.id));
  const resolvedProblems = userProblems.filter(p => p.status === 'Resolved').length;
  const recentProblems = userProblems.slice(0, 3);

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Resolved': return 'default';
        case 'In Progress': return 'secondary';
        case 'Awaiting Approval':
        case 'Registered':
             return 'outline';
        default: return 'destructive';
    }
  };

  const handleDelete = async () => {
    if(!problemToDelete) return;
    setIsDeleting(true);
    
    const result = await deleteProblem(problemToDelete);
    
    if (result.success) {
        toast({
            title: "Success",
            description: "The issue has been deleted."
        })
    } else {
        toast({
            title: "Error Deleting Issue",
            description: result.error,
            variant: "destructive"
        })
    }
    
    setProblemToDelete(null);
    setIsDeleting(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
            
            <div className='text-center'>
                 <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary">
                    {user.data.avatarUrl && <AvatarImage src={user.data.avatarUrl} alt={user.data.name} />}
                    <AvatarFallback className="text-4xl">{user.data.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="text-3xl font-bold font-headline">{user.data.name}</h1>
                <p className="text-muted-foreground">Civic Contributor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
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
                        <Separator />
                         <div className="flex items-center gap-4">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                             <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p>{user.data.mobile}</p>
                            </div>
                        </div>
                         <Separator />
                        <div className="flex items-center gap-4">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                             <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p>New York, NY</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Activity Status</CardTitle>
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
            </div>
            
            <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
                <CardHeader className="flex flex-row items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary"/>
                    <CardTitle className="text-lg mb-0">Recent Reported Problems</CardTitle>
                </CardHeader>
                <CardContent>
                    {userProblems.length > 0 ? (
                        <div className="space-y-4">
                        {userProblems.map(problem => (
                            <div key={problem.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                                <div>
                                    <p className="font-semibold">{problem.title}</p>
                                    <p className="text-sm text-muted-foreground">{problem.location.address} &middot; Reported {formatDistanceToNow(new Date(problem.createdAt), { addSuffix: true })}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getStatusVariant(problem.status)}>{problem.status}</Badge>
                                  {(problem.status === 'Awaiting Approval' || problem.status === 'Pending') && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProblemToDelete(problem.id)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your
                                            reported issue from our servers.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel onClick={() => setProblemToDelete(null)}>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Continue
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                            </div>
                        ))}
                         <div className="text-center pt-4">
                            <Button variant="ghost" asChild>
                                <Link href="/profile/reports">View All Reports</Link>
                            </Button>
                        </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No reports filed yet.</p>
                    )}
                </CardContent>
            </Card>

             <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
                <CardHeader className="flex flex-row items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <CardTitle className="text-lg mb-0">Rewards & Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div>
                            <p className="font-semibold">Civic Points</p>
                            <p className="text-sm text-muted-foreground">Earned from contributions</p>
                        </div>
                        <div className="text-right">
                             <p className="text-2xl font-bold text-primary">{user.data.civicPoints?.toLocaleString() || 0}</p>
                             <p className="text-sm text-green-500">+150 this week</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
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
