import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold font-headline text-primary", className)}>
      <div className="p-1.5 bg-primary text-primary-foreground rounded-md">
        <Megaphone className="h-5 w-5" />
      </div>
      <span>Voice2Action</span>
    </Link>
  );
}
