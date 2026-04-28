
"use client";

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Info, Circle, ThumbsUp, Calendar, ThumbsDown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useProblems } from '@/context/problem-context';
import type { Problem } from '@/lib/definitions';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

export default function ExplorePage() {
    const { toast } = useToast();
    const mapRef = useRef<LeafletMap | null>(null);
    const userLocationMarkerRef = useRef<LeafletMarker | null>(null);
    const { problems, voteOnProblem } = useProblems();
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

    const handleGPSClick = useCallback(() => {
      if (navigator.geolocation) {
        toast({ title: "Locating...", description: "Zooming into your current location." });
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            if (mapRef.current) {
              mapRef.current.setView([latitude, longitude], 13);
              
              if (userLocationMarkerRef.current) {
                userLocationMarkerRef.current.setLatLng([latitude, longitude]);
              } else {
                const L = await import('leaflet');
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
    }, [toast]);
    
  return (
    <>
    <div className="theme-shell flex min-h-screen flex-col">
      <main className="flex-1" data-testid="page-explore">
        <div className="container mx-auto max-w-4xl px-6 py-16">
          <div className="mb-12 text-center">
            <h1 className="mb-6 text-5xl font-headline font-bold text-primary md:text-6xl">
              Explore Reported Issues
            </h1>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">
              Use the interactive map to see what's happening in different areas. Click on a marker to view details about a reported problem.
            </p>
          </div>

          <Card className="theme-panel-soft overflow-hidden">
            <CardContent className="p-2 md:p-4 relative">
              <div className="absolute top-4 left-4 z-[51] flex gap-2">
                <Button onClick={handleGPSClick}>
                  <MapPin className="mr-2 h-4 w-4" /> Use My GPS Location
                </Button>
              </div>
              
              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden z-0">
                <MapView problems={problems} mapRef={mapRef} onProblemSelect={setSelectedProblem} />
              </div>
               <div className="p-4 text-center text-sm text-muted-foreground">
                Interactive map powered by Leaflet. The markers represent issue statuses.
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 max-w-sm">
            <Card className="theme-panel-soft">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-accent" />
                        <CardTitle>Map Legend</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: 'red', transform: 'rotate(45deg)', borderRadius: '50% 50% 50% 0' }} />
                            <span className="text-sm flex items-center gap-1.5">Awaiting Approval</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: 'yellow', transform: 'rotate(45deg)', borderRadius: '50% 50% 50% 0' }} />
                            <span className="text-sm flex items-center gap-1.5">Registered</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: 'blue', transform: 'rotate(45deg)', borderRadius: '50% 50% 50% 0' }} />
                            <span className="text-sm flex items-center gap-1.5">In Progress</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: 'green', transform: 'rotate(45deg)', borderRadius: '50% 50% 50% 0' }} />
                            <span className="text-sm">Resolved</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: 'grey', transform: 'rotate(45deg)', borderRadius: '50% 50% 50% 0' }} />
                            <span className="text-sm">Rejected</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
          </div>

        </div>
      </main>
      <style jsx global>{`
        .blinking-marker .leaflet-marker-icon {
            filter: hue-rotate(120deg);
        }
        .leaflet-popup-content-wrapper {
            background-color: hsl(var(--card));
            color: hsl(var(--card-foreground));
            border-radius: 14px;
            border: 1px solid hsl(var(--border));
            box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.45);
        }
        .leaflet-popup-content {
            margin: 0;
            width: 256px !important;
        }
        .leaflet-popup-tip {
            background: hsl(var(--card));
        }
      `}</style>
    </div>
    <Dialog open={!!selectedProblem} onOpenChange={(isOpen) => !isOpen && setSelectedProblem(null)}>
        <DialogContent className="sm:max-w-2xl">
            {selectedProblem && (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-headline">{selectedProblem.title}</DialogTitle>
                         <div className="flex items-center gap-3 pt-2">
                            <Badge variant={selectedProblem.status === 'Resolved' ? 'default' : selectedProblem.status === 'In Progress' ? 'secondary' : 'outline'}>
                                {selectedProblem.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{selectedProblem.department}</span>
                        </div>
                    </DialogHeader>
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                           <Image 
                                src={selectedProblem.media.images[0] || `https://picsum.photos/seed/${selectedProblem.id}/1200/675`}
                                alt={selectedProblem.title}
                                fill
                                className="object-cover"
                                data-ai-hint="issue photo"
                            />
                        </div>
                        <p className="text-muted-foreground">{selectedProblem.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-semibold">Location</p>
                                    <p className="text-muted-foreground">{selectedProblem.location.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-semibold">Reported On</p>
                                    <p className="text-muted-foreground">{format(new Date(selectedProblem.createdAt), 'PP')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-4">
                           <div className="flex items-center gap-4">
                               <Button variant="outline" onClick={() => voteOnProblem(selectedProblem.id, 'like')}>
                                   <ThumbsUp className="w-4 h-4 mr-2" />
                                   {selectedProblem.likes}
                               </Button>
                               <Button variant="outline" onClick={() => voteOnProblem(selectedProblem.id, 'dislike')}>
                                   <ThumbsDown className="w-4 h-4 mr-2" />
                                   {selectedProblem.dislikes}
                               </Button>
                           </div>
                           <p className="text-muted-foreground text-sm">{selectedProblem.likes + selectedProblem.dislikes} total votes</p>
                        </div>
                    </div>
                </>
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}
