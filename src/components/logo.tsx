import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/10">
        <Megaphone className="h-6 w-6" />
      </div>
      <div>
        <div className="text-xl font-bold font-headline text-primary">Voice2Action</div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Civic Accountability Platform</p>
      </div>
    </Link>
  );
}
