"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockProblems } from '@/lib/data';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Problem } from '@/lib/definitions';
import { Loader2 } from 'lucide-react';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

export default function ExplorePage() {
    const { toast } = useToast();
    
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">
              Explore Reported Issues
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Use the interactive map to see what's happening in different areas. Click on a marker to view details about a reported problem.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-2 md:p-4 relative">
              <div className="absolute top-4 left-4 z-[1000]">
                <Button onClick={() => toast({ title: "Locating...", description: "Zooming into your current location." })}>
                  <MapPin className="mr-2 h-4 w-4" /> Use My GPS Location
                </Button>
              </div>
              
              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden">
                <MapView problems={mockProblems} />
              </div>
               <div className="p-4 text-center text-muted-foreground text-sm">
                Interactive map powered by Leaflet. The markers represent issues, with colors indicating popularity.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}