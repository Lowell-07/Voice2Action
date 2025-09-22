
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

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [otp, setOtp] = useState('');
  
  useEffect(() => {
    if (user.type === 'user') {
      router.push('/profile');
    }
  }, [user, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering && !name.trim()) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
    }
    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
        toast({
            title: "Invalid Mobile Number",
            description: "Please enter a valid 10-digit mobile number.",
            variant: "destructive",
        });
        return;
    }
    setIsLoading(true);

    // Simulate OTP sending
    setTimeout(() => {
        setIsLoading(false);
        setOtpSent(true);
        toast({
            title: "OTP Sent!",
            description: "An OTP has been sent to your mobile number (use 123456).",
        });
    }, 1000);
  };
  
  const handleVerify = async (e: React.FormEvent) => {
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

      const result = await login('user', name, mobile);

      if (result.success) {
          toast({
              title: result.isNewUser ? "Registration Successful!" : "Login Successful!",
              description: "Welcome!",
          });
          // The useEffect will handle the redirect to /profile
      } else {
           toast({
              title: "An Error Occurred",
              description: result.error,
              variant: "destructive",
          });
          setIsLoading(false);
      }
  };

  const toggleForm = () => {
    setIsRegistering(!isRegistering);
    setOtpSent(false);
    setOtp('');
  }

  const cardTitle = otpSent ? "Verify OTP" : (isRegistering ? "Create Account" : "User Login");
  const cardDescription = otpSent 
    ? `Enter the OTP sent to +91 ${mobile}` 
    : (isRegistering ? "Join Voice2Action to make a difference." : "Access your profile and report issues.");


  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline">
            {cardTitle}
          </CardTitle>
          <CardDescription>
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={otpSent ? handleVerify : handleSendOtp} className="space-y-6">
            {!otpSent ? (
              <>
                {isRegistering && (
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                            id="name" 
                            type="text" 
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                        />
                    </div>
                )}
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
              </>
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
              {otpSent ? "Verify & Continue" : "Send OTP"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
           {otpSent ? (
                <Button variant="link" size="sm" onClick={() => {setOtpSent(false); setOtp('');}}>
                    Change mobile number
                </Button>
            ) : (
                 <p className="text-xs text-muted-foreground text-center w-full">
                    {isRegistering ? "Already have an account?" : "New User?"}
                    <Button variant="link" size="sm" onClick={toggleForm}>
                       {isRegistering ? "Login" : "Register"}
                    </Button>
                </p>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
