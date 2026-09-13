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
  const { user, login, isAuthLoaded } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success && result.userType === 'admin') {
      toast({ title: 'Admin Login Successful' });
      router.replace('/admin/dashboard');
    } else {
      toast({ title: 'Invalid Credentials', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    router.prefetch('/admin/dashboard');
    if (isAuthLoaded && user.type === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [user, isAuthLoaded, router]);

  if (!isAuthLoaded || user.type === 'loading') {
    return (
      <div className="theme-shell flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-lg text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-shell flex min-h-screen items-center justify-center px-6 py-16" data-testid="page-admin-login">
      <Card className="theme-panel-soft w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Admin Login</CardTitle>
          <CardDescription className="text-base">Access the administrator dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6" data-testid="admin-login-form">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required data-testid="admin-username-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="........" value={password} onChange={e => setPassword(e.target.value)} required data-testid="admin-password-input" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="admin-login-button">
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
