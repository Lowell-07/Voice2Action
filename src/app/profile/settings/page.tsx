
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Moon, Sun, Mail, MessageSquare, Eye, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    
    useEffect(() => {
        if (user.type === 'guest') {
            router.push('/login');
        }
    }, [user, router]);
    
    if (!mounted || user.type === 'guest') {
        return (
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 flex items-center justify-center">
                <div className='flex items-center gap-2 text-lg text-muted-foreground'>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
          </div>
        );
    }

    return (
        <main className="flex-1 py-8 md:py-12">
            <div className="container max-w-2xl mx-auto px-4">
                <div className="mb-8 flex items-center justify-between">
                     <Button asChild variant="ghost">
                        <Link href="/profile">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Profile
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold font-headline">Settings</h1>
                </div>

                <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your Voice2Action experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                {theme === 'light' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
                                <div>
                                    <Label htmlFor="theme-switch">Theme</Label>
                                    <p className="text-sm text-muted-foreground">{theme === 'light' ? 'Light mode' : 'Dark mode'}</p>
                                </div>
                            </div>
                            <Switch 
                                id="theme-switch"
                                checked={theme === 'dark'}
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            />
                        </div>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="email-notifications">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive updates on your reports</p>
                                </div>
                            </div>
                            <Switch id="email-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="sms-alerts">SMS Alerts</Label>
                                    <p className="text-sm text-muted-foreground">Get SMS updates on issue resolution</p>
                                </div>
                            </div>
                            <Switch id="sms-alerts" />
                        </div>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                                <Eye className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="public-profile">Public Profile</Label>
                                    <p className="text-sm text-muted-foreground">Make your contributions visible to others</p>
                                </div>
                            </div>
                            <Switch id="public-profile" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                 <Card className="mt-8 shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" className="w-full" onClick={() => {
                            logout();
                            router.push('/');
                        }}>
                           <LogOut className="w-4 h-4 mr-2" /> Logout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
