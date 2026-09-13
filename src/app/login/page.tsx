
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { formatPhoneNumber } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, sendOtp, verifyOtp, isAuthLoaded } = useAuth();
  const { toast } = useToast();
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  
  useEffect(() => {
    router.prefetch('/profile');
    if (isAuthLoaded && user.type === 'user') {
      router.replace('/profile');
    }
  }, [user, isAuthLoaded, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\+91\d{10}$/.test(formatPhoneNumber(mobile))) {
        toast({
            title: "Invalid Mobile Number",
            description: "Please enter a valid 10-digit mobile number.",
            variant: "destructive",
        });
        return;
    }
    setIsLoading(true);
    const result = await sendOtp(mobile);
    setIsLoading(false);
    if (result.success) {
      setOtpSent(true);
      toast({ title: 'OTP Sent!', description: 'An OTP has been sent to your mobile number.' });
    } else {
      toast({ title: 'Unable to send OTP', description: result.error, variant: 'destructive' });
    }
  };
  
  const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const result = await verifyOtp(mobile, otp);
      setIsLoading(false);

      if (result.success) {
          toast({
              title: "Login Successful!",
              description: "Welcome back to Voice2Action!",
          });
          router.replace('/profile');
      } else {
           toast({
              title: "Login Failed",
              description: result.error,
              variant: "destructive",
          });
      }
  };

  const cardTitle = otpSent ? "Verify OTP" : "User Login";
  const cardDescription = otpSent 
    ? `Enter the OTP sent to ${formatPhoneNumber(mobile)}` 
    : "Enter your mobile to get started.";

  if (!isAuthLoaded || user.type === 'loading') {
    return (
      <div className="theme-shell flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
            <div className='flex items-center gap-2 text-lg text-muted-foreground'>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Initializing Session...</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-shell flex min-h-screen items-center justify-center px-6 py-16" data-testid="page-login">
      <Card className="theme-panel-soft w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">
            {cardTitle}
          </CardTitle>
          <CardDescription className="text-base">
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={otpSent ? handleVerify : handleSendOtp} className="space-y-6" data-testid="user-login-form">
            {!otpSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobile">10-digit Mobile Number</Label>
                  <Input 
                    id="mobile" 
                    type="tel" 
                    data-testid="login-mobile-input"
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={16}
                    required 
                  />
                </div>
              </>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="otp">One-Time Password (OTP)</Label>
                    <Input
                        id="otp"
                        type="text"
                        data-testid="login-otp-input"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                    />
                </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading} data-testid={otpSent ? "login-verify-button" : "login-send-otp-button"}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpSent ? "Verify & Login" : "Send OTP"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
           {otpSent && (
                <Button variant="link" size="sm" onClick={() => {setOtpSent(false); setOtp('');}}>
                    Change mobile number
                </Button>
            )}
            <Button variant="link" size="sm" asChild>
                <Link href="/register">Don't have an account? Register</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
