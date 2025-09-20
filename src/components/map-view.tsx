"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Problem } from '@/lib/definitions';
import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import Image from 'next/image';
import { useRef, useEffect } from 'react';

// Fix for default icon path in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  problems: Problem[];
}

const getDotColor = (likeCount: number) => {
    if (likeCount >= 10) return 'red';
    if (likeCount >= 5) return 'orange';
    if (likeCount >= 1) return 'yellow';
    return 'green';
};

export default function MapView({ problems }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const defaultPosition: [number, number] = [20.5937, 78.9629]; // Center of India

  return (
    <MapContainer
      center={defaultPosition} 
      zoom={5} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%' }}
      whenCreated={map => mapRef.current = map}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {problems.map(problem => (
        <Marker key={problem.id} position={[problem.location.coordinates.lat, problem.location.coordinates.lng]}>
          <Popup>
            <div className="w-64">
              <div className="relative w-full h-32 mb-2 rounded-md overflow-hidden">
                <Image src={`https://picsum.photos/seed/${problem.media.images[0]}/600/400`} alt={problem.title} layout="fill" objectFit="cover" />
              </div>
              <h3 className="font-bold text-lg mb-1">{problem.title}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{problem.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">{problem.likes} Likes</span>
                <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8">
                        <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                        <ThumbsDown className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>
          </Popup>
          <Circle 
            center={[problem.location.coordinates.lat, problem.location.coordinates.lng]} 
            radius={20000} // Adjust radius as needed
            pathOptions={{ color: getDotColor(problem.likes), fillColor: getDotColor(problem.likes), fillOpacity: 0.5 }}
          />
        </Marker>
      ))}
    </MapContainer>
  );
}
