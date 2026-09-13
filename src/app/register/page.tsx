
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

export default function RegisterPage() {
  const router = useRouter();
  const { user, sendOtp, registerWithOtp } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  
  useEffect(() => {
    if (user.type === 'user') {
      router.push('/profile');
    }
  }, [user, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        toast({ title: "Name is required", description: "Please enter your name to register.", variant: "destructive" });
        return;
    }
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
      const result = await registerWithOtp(name, mobile, otp);
      setIsLoading(false);

      if (result.success) {
          toast({
              title: "Registration Successful!",
              description: "Welcome to Voice2Action!",
          });
          // The useEffect will handle the redirect to /profile
      } else {
           toast({
              title: "Registration Failed",
              description: result.error,
              variant: "destructive",
          });
      }
  };

  const cardTitle = otpSent ? "Verify OTP" : "Create an Account";
  const cardDescription = otpSent 
    ? `Enter the OTP sent to ${formatPhoneNumber(mobile)}` 
    : "Enter your name and mobile to get started.";

  return (
    <div className="theme-shell flex min-h-screen items-center justify-center px-6 py-16" data-testid="page-register">
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
          <form onSubmit={otpSent ? handleVerify : handleSendOtp} className="space-y-6" data-testid="register-form">
            {!otpSent ? (
              <>
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                        id="name" 
                        type="text" 
                        data-testid="register-name-input"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required 
                    />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">10-digit Mobile Number</Label>
                  <Input 
                    id="mobile" 
                    type="tel" 
                    data-testid="register-mobile-input"
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
                        data-testid="register-otp-input"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                    />
                </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading} data-testid={otpSent ? "register-verify-button" : "register-send-otp-button"}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpSent ? "Verify & Register" : "Send OTP"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
           {otpSent && (
                <Button variant="link" size="sm" onClick={() => {setOtpSent(false); setOtp('');}}>
                    Change mobile number or name
                </Button>
            )}
            <Button variant="link" size="sm" asChild>
                <Link href="/login">Already have an account? Login</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
