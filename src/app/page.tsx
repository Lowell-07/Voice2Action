import DashboardClient from '@/app/dashboard-client';
import Image from 'next/image';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background dark">
      <div className="fixed inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop"
          alt="Starry night sky"
          fill
          style={{ objectFit: 'cover' }}
          className="opacity-20"
        />
      </div>
      <DashboardClient />
    </div>
  );
}