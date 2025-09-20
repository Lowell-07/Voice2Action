import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';
import { Header } from '@/components/layout/header';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Voice2Action',
  description:
    'Report civic issues, track progress, and build a better community.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='dark' suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased'
        )}
      >
        <Image
          src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop"
          alt="Starry night sky"
          fill
          style={{ objectFit: 'cover' }}
          className="fixed inset-0 -z-10 opacity-20"
        />
        <Providers>
            <Header />
            <div className="pb-16 md:pb-0">
                {children}
            </div>
        </Providers>
      </body>
    </html>
  );
}
