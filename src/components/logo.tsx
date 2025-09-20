import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <div className="p-2 bg-primary text-primary-foreground rounded-md">
        <Megaphone className="h-6 w-6" />
      </div>
      <div>
        <div className="text-xl font-bold font-headline text-foreground">Voice2Action</div>
        <p className="text-xs text-muted-foreground">Civic Accountability Platform</p>
      </div>
    </Link>
  );
}
