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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { departments } from '@/lib/data';

export default function DepartmentLoginPage() {
  const router = useRouter();
  const { user, login, isAuthLoaded } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) {
      toast({ title: 'Department not selected', description: 'Please select your department to log in.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const result = await login(selectedDepartment, selectedDepartment);

    if (result.success && result.userType === 'department') {
      toast({ title: 'Department Login Successful' });
      router.replace('/department/dashboard');
    } else {
      toast({ title: 'Login Failed', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    router.prefetch('/department/dashboard');
    if (isAuthLoaded && user.type === 'department') {
      router.replace('/department/dashboard');
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
    <div className="theme-shell flex min-h-screen items-center justify-center px-6 py-16" data-testid="page-department-login">
      <Card className="theme-panel-soft w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Department Login</CardTitle>
          <CardDescription className="text-base">Access your department&apos;s issue dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6" data-testid="department-login-form">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select required onValueChange={setSelectedDepartment} value={selectedDepartment}>
                <SelectTrigger id="department" data-testid="department-select-trigger">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="Enter your username" required data-testid="department-username-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="........" required data-testid="department-password-input" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="department-login-button">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button variant="link" size="sm" asChild>
            <Link href="/login">Return to User Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
