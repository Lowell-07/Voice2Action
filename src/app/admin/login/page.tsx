
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(username, password);

    if (result.success && result.userType === 'admin') {
        toast({ title: "Admin Login Successful" });
        router.push('/admin/dashboard');
    } else {
        toast({ title: "Invalid Credentials", variant: "destructive" });
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user.type === 'admin') {
        router.push('/admin/dashboard');
    }
  }, [user, router]);


  if (user.type === 'admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className='flex items-center gap-2 text-lg text-muted-foreground'>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline">Admin Login</CardTitle>
          <CardDescription>Access the administrator dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button variant="link" size="sm" asChild>
            <Link href="/login">Return to User Login</Link>
          </Button>
           <Button variant="link" size="sm" asChild>
            <Link href="/department/login">Department Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
