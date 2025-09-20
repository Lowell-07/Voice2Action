import DashboardClient from '@/app/dashboard-client';
import { Header } from '@/components/layout/header';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <DashboardClient />
    </div>
  );
}
