
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ArrowLeft, Camera, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getProfileImageSrc } from '@/lib/profile';

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(user.type === 'user' ? user.data.name : '');
  const [email, setEmail] = useState(user.type === 'user' ? user.data.email || '' : '');
  const [avatar, setAvatar] = useState(user.type === 'user' ? getProfileImageSrc(user.data.avatarUrl) : '');

  useEffect(() => {
    if (user.type !== 'user') {
      router.push('/login');
    }
  }, [user, router]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        updateUser({
            name,
            email,
            avatarUrl: avatar
        });
        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        });
        setIsLoading(false);
        router.push('/profile');
    }, 1500);
  };
  
  if (user.type !== 'user') {
    return (
      <div className="theme-shell flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
            <div className='flex items-center gap-2 text-lg text-muted-foreground'>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Redirecting...</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-shell flex min-h-screen flex-col">
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto max-w-2xl px-6 py-8">
           <div className='mb-8'>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Profile
                    </Link>
                </Button>
            </div>
            
          <Card className="theme-panel-soft shadow-xl">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-accent/20 shadow-md">
                      <AvatarImage src={getProfileImageSrc(avatar)} alt={name} />
                      <AvatarFallback className="bg-primary text-4xl text-primary-foreground">
                        {name ? name.charAt(0) : <UserIcon />}
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 block cursor-pointer rounded-full bg-primary p-2 text-primary-foreground shadow-sm transition-colors hover:bg-accent">
                        <Camera className="h-4 w-4" />
                        <Input id="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                    </Label>
                  </div>
                   <div className='flex-1'>
                    <h2 className="text-2xl font-bold font-headline">{name || "Your Name"}</h2>
                    <p className="text-muted-foreground">Update your photo and personal details.</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                
                 <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
