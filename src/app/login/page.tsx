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
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (user.type === 'user') {
      router.push('/profile');
    }
  }, [user, router]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
        toast({
            title: "Invalid Mobile Number",
            description: "Please enter a valid 10-digit mobile number.",
            variant: "destructive",
        });
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        setOtpSent(true);
        setIsLoading(false);
        toast({
            title: "OTP Sent!",
            description: "An OTP has been sent to your mobile number (use 123456).",
        });
    }, 1000);
  };
  
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (otp !== '123456') {
          toast({
              title: "Invalid OTP",
              description: "The OTP you entered is incorrect.",
              variant: "destructive",
          });
          return;
      }
      setIsLoading(true);
      setTimeout(() => {
          login('user');
          setIsLoading(false);
          toast({
              title: "Login Successful!",
              description: "Welcome back!",
          });
          router.push('/profile');
      }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline">
            {otpSent ? "Verify OTP" : "User Login"}
          </CardTitle>
          <CardDescription>
            {otpSent ? `Enter the OTP sent to +91 ${mobile}` : "Access your profile and report issues."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={otpSent ? handleLogin : handleSendOtp} className="space-y-6">
            {!otpSent ? (
              <div className="space-y-2">
                <Label htmlFor="mobile">10-digit Mobile Number</Label>
                <Input 
                  id="mobile" 
                  type="tel" 
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength={10}
                  required 
                />
              </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="otp">One-Time Password (OTP)</Label>
                    <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                    />
                </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
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
          <p className="text-xs text-muted-foreground text-center w-full">
            Looking for admin or department login? <Link href="/admin/login" className="underline">Click here</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
