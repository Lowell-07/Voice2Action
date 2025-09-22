
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Moon, Sun, Mail, MessageSquare, Eye, LogOut, Loader2, Languages } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const t = useTranslations('Settings');

    useEffect(() => setMounted(true), []);
    
    useEffect(() => {
        if (user.type === 'guest') {
            router.push('/login');
        }
    }, [user, router]);

    const handleLanguageChange = (locale: string) => {
        // This will redirect to the same page with the new locale
        // E.g., from /en/profile/settings to /hi/profile/settings
        const newPath = `/${locale}${pathname}`;
        router.replace(newPath);
    };
    
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

    const currentLocale = pathname.split('/')[1] || 'en';

    return (
        <main className="flex-1 py-8 md:py-12">
            <div className="container max-w-2xl mx-auto px-4">
                <div className="mb-8 flex items-center justify-between">
                     <Button asChild variant="ghost">
                        <Link href="/profile">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('backToProfile')}
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold font-headline">{t('title')}</h1>
                </div>

                <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
                    <CardHeader>
                        <CardTitle>{t('preferencesTitle')}</CardTitle>
                        <CardDescription>{t('preferencesDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                {theme === 'light' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
                                <div>
                                    <Label htmlFor="theme-switch">{t('theme')}</Label>
                                    <p className="text-sm text-muted-foreground">{theme === 'light' ? t('lightMode') : t('darkMode')}</p>
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
                                <Languages className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label>{t('language')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('languageDescription')}</p>
                                </div>
                            </div>
                            <Select defaultValue={currentLocale} onValueChange={handleLanguageChange}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi">हिन्दी</SelectItem>
                                    <SelectItem value="bn">বাংলা</SelectItem>
                                    <SelectItem value="te">తెలుగు</SelectItem>
                                    <SelectItem value="ta">தமிழ்</SelectItem>
                                    <SelectItem value="mr">मराठी</SelectItem>
                                    <SelectItem value="gu">ગુજરાતી</SelectItem>
                                    <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                                    <SelectItem value="ml">മലയാളം</SelectItem>
                                    <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
                                    <SelectItem value="ur">اردو</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="email-notifications">{t('emailNotifications')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('emailNotificationsDescription')}</p>
                                </div>
                            </div>
                            <Switch id="email-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="sms-alerts">{t('smsAlerts')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('smsAlertsDescription')}</p>
                                </div>
                            </div>
                            <Switch id="sms-alerts" />
                        </div>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                                <Eye className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="public-profile">{t('publicProfile')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('publicProfileDescription')}</p>
                                </div>
                            </div>
                            <Switch id="public-profile" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                 <Card className="mt-8 shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
                    <CardHeader>
                        <CardTitle>{t('accountTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" className="w-full" onClick={() => {
                            logout();
                            router.push('/');
                        }}>
                           <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
