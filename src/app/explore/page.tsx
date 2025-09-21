
"use client";

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type L from 'leaflet';
import { useProblems } from '@/context/problem-context';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

export default function ExplorePage() {
    const { toast } = useToast();
    const mapRef = useRef<L.Map | null>(null);
    const userLocationMarkerRef = useRef<L.Marker | null>(null);
    const { problems } = useProblems();

    const handleGPSClick = () => {
      if (navigator.geolocation) {
        toast({ title: "Locating...", description: "Zooming into your current location." });
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (mapRef.current) {
              mapRef.current.setView([latitude, longitude], 13);
              
              if (userLocationMarkerRef.current) {
                userLocationMarkerRef.current.setLatLng([latitude, longitude]);
              } else {
                 const userIcon = new L.Icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                    className: 'blinking-marker' 
                });

                userLocationMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current);
              }
               userLocationMarkerRef.current?.bindPopup("Your Location").openPopup();
            }
          },
          () => {
            toast({
              title: 'Error',
              description: 'Unable to retrieve your location.',
              variant: 'destructive',
            });
          }
        );
      } else {
        toast({
          title: 'Error',
          description: 'Geolocation is not supported by this browser.',
          variant: 'destructive',
        });
      }
    };
    
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
              <div className="absolute top-4 left-4 z-[51]">
                <Button onClick={handleGPSClick}>
                  <MapPin className="mr-2 h-4 w-4" /> Use My GPS Location
                </Button>
              </div>
              
              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden z-0">
                <MapView problems={problems} mapRef={mapRef} />
              </div>
               <div className="p-4 text-center text-muted-foreground text-sm">
                Interactive map powered by Leaflet. The markers represent issues, with colors indicating popularity.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <style jsx global>{`
        .blinking-marker .leaflet-marker-icon {
            filter: hue-rotate(120deg);
        }
      `}</style>
    </div>
  );
}
