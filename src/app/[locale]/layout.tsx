
import type { Metadata } from 'next';
import '../globals.css';
import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';
import { Header } from '@/components/layout/header';
import { getMessages } from 'next-intl/server';
import {notFound} from 'next/navigation';

export const metadata: Metadata = {
  title: 'Voice2Action',
  description:
    'Report civic issues, track progress, and build a better community.',
};

export default async function RootLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
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
        <Providers locale={locale} messages={messages}>
            <Header />
            <div className="pb-16 md:pb-0">
                {children}
            </div>
        </Providers>
      </body>
    </html>
  );
}
