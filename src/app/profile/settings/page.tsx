"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Moon, Sun, Mail, MessageSquare, Eye, LogOut, Loader2, Languages } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <main className="theme-shell flex-1 py-8 md:py-12">
      <div className="container mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link href="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Link>
          </Button>
          <h1 className="text-2xl font-bold font-headline text-primary">Settings</h1>
        </div>

        <Card className="theme-panel-soft shadow-lg">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your Voice2Action experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-xl bg-secondary/55 p-4">
              <div className="flex items-center gap-4">
                {theme === 'light' ? <Sun className="h-5 w-5 text-accent" /> : <Moon className="h-5 w-5 text-accent" />}
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
            <div className="flex items-center justify-between rounded-xl bg-secondary/55 p-4">
              <div className="flex items-center gap-4">
                <Languages className="h-5 w-5 text-accent" />
                <div>
                  <Label>Language</Label>
                  <p className="text-sm text-muted-foreground">Choose your preferred language</p>
                </div>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-[132px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi" disabled>Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/55 p-4">
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-accent" />
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates on your reports</p>
                </div>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/55 p-4">
              <div className="flex items-center gap-4">
                <MessageSquare className="h-5 w-5 text-accent" />
                <div>
                  <Label htmlFor="sms-alerts">SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get SMS updates on issue resolution</p>
                </div>
              </div>
              <Switch id="sms-alerts" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/55 p-4">
              <div className="flex items-center gap-4">
                <Eye className="h-5 w-5 text-accent" />
                <div>
                  <Label htmlFor="public-profile">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Make your contributions visible to others</p>
                </div>
              </div>
              <Switch id="public-profile" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="theme-panel-soft mt-8 shadow-lg">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full" onClick={() => {
              logout();
              router.push('/');
            }}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
