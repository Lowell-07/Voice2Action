"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Presentation,
  UserCircle,
  X,
  FilePenLine,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

const mainNavLinks = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/explore', label: 'Explore', icon: <Presentation /> },
];

const userNavLinks = [
  { href: '/report', label: 'Report Problem', icon: <FilePenLine /> },
  { href: '/profile', label: 'Profile', icon: <UserCircle /> },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [...mainNavLinks];
  if (user.type !== 'guest') {
    navLinks.push(...userNavLinks);
  }

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Button
        key={link.href}
        variant={pathname === link.href ? 'link' : 'ghost'}
        asChild
        className={cn('justify-start text-foreground/80 hover:text-foreground', pathname === link.href && 'text-foreground font-semibold', isMobile ? 'w-full' : '')}
        onClick={() => isMobile && setMobileMenuOpen(false)}
      >
        <Link href={link.href}>
          {isMobile && link.icon}
          <span>{link.label}</span>
        </Link>
      </Button>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-transparent backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {renderNavLinks()}
          {user.type === 'guest' ? (
            <Button asChild>
              <Link href="/login">
                <LogIn />
                Login
              </Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={logout}>
              <LogOut />
              Logout
            </Button>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background/95">
              <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                   <Logo />
                   <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                     <X />
                   </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {renderNavLinks(true)}
                  <hr className="my-2" />
                  {user.type === 'guest' ? (
                    <Button asChild onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/login">
                        <LogIn />
                        Login
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                      <LogOut />
                      Logout
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
