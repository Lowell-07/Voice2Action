
"use client";

import Link from 'next/link';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  PlusCircle,
  Compass,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getProfileImageSrc } from '@/lib/profile';


const desktopNavLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/explore', label: 'Explore' },
    { href: '/report', label: 'Report a Problem' },
];

const mobileNavLinks = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6" /> },
  { href: '/explore', label: 'Explore', icon: <Compass className="w-6 h-6" /> },
  { href: '/report', label: 'Report', icon: <PlusCircle className="w-6 h-6" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

const mobileGuestNavLinks = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6" /> },
  { href: '/explore', label: 'Explore', icon: <Compass className="w-6 h-6" /> },
  { href: '/login', label: 'Login', icon: <LogIn className="w-6 h-6" /> },
]

export function HeaderClient({ pathname }: { pathname: string | null }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 hidden w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 md:block">
        <div className="container flex h-[88px] max-w-7xl items-center justify-between px-6">
          <div className='flex items-center gap-10'>
            <Logo />
            <nav className="flex items-center gap-8" data-testid="desktop-nav">
              {desktopNavLinks.map(link => (
                  <Link 
                      key={link.href} 
                      href={link.href}
                      data-testid={`nav-link-${link.href === '/' ? 'dashboard' : link.href.replace('/', '').replace(/\//g, '-')}`}
                      className={cn(
                          "border-b-2 border-transparent pb-1 text-sm font-semibold transition-all",
                          pathname === link.href
                            ? "border-accent text-primary"
                            : "text-muted-foreground hover:border-accent/40 hover:text-accent"
                      )}
                  >
                      {link.label}
                  </Link>
              ))}
            </nav>
          </div>

          <nav className="flex items-center gap-4">
            {user.type === 'guest' ? (
              <Button asChild className="px-5">
                <Link href="/login" data-testid="nav-link-login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border bg-secondary/50 hover:bg-secondary" data-testid="header-profile-trigger">
                     <Avatar className='h-10 w-10'>
                       {user.type === 'user' && <AvatarImage src={getProfileImageSrc(user.data.avatar_url)} alt={user.data.name} data-testid="header-profile-image" />}
                       <AvatarFallback>
                         {user.type === 'user' && user.data.name.charAt(0)}
                         {user.type === 'admin' && user.data.name.charAt(0)}
                       </AvatarFallback>
                     </Avatar>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.type === 'user' && user.data.name}
                        {user.type === 'admin' && user.data.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.type === 'user' && (user.data.email || user.data.mobile)}
                        {user.type === 'admin' && user.data.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
        <nav className="container flex h-16 items-center justify-around">
          {user.type === 'user' ? mobileNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium",
                pathname === link.href ? 'text-primary' : 'text-muted-foreground hover:text-accent'
              )}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          )) : mobileGuestNavLinks.map((link) => (
             <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium",
                pathname === link.href ? 'text-primary' : 'text-muted-foreground hover:text-accent'
              )}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
