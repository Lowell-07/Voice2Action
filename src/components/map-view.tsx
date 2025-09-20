"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Problem } from '@/lib/definitions';
import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';

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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const defaultPosition: [number, number] = [20.5937, 78.9629]; // Center of India

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(defaultPosition, 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      
      problems.forEach(problem => {
        const marker = L.marker([problem.location.coordinates.lat, problem.location.coordinates.lng]).addTo(mapRef.current!);
        
        const popupContent = `
            <div class="w-64">
              <div class="relative w-full h-32 mb-2 rounded-md overflow-hidden">
                <img src="https://picsum.photos/seed/${problem.media.images[0]}/600/400" alt="${problem.title}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <h3 class="font-bold text-lg mb-1">${problem.title}</h3>
              <p class="text-sm text-muted-foreground mb-2 line-clamp-2">${problem.description}</p>
              <div class="flex justify-between items-center">
                <span class="text-sm font-semibold">${problem.likes} Likes</span>
              </div>
            </div>
        `;

        marker.bindPopup(popupContent);

        L.circle([problem.location.coordinates.lat, problem.location.coordinates.lng], {
          radius: 20000,
          color: getDotColor(problem.likes),
          fillColor: getDotColor(problem.likes),
          fillOpacity: 0.5,
        }).addTo(mapRef.current!);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [problems, defaultPosition]);


  return (
    <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
  );
}
