
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Problem } from '@/lib/definitions';
import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

// Fix for default icon path in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  problems: Problem[];
  mapRef: MutableRefObject<L.Map | null>;
}

const getDotColor = (likeCount: number) => {
    if (likeCount >= 10) return 'red';
    if (likeCount >= 5) return 'orange';
    if (likeCount >= 1) return 'yellow';
    return 'green';
};

export default function MapView({ problems, mapRef }: MapViewProps) {
  const mapContainerRef = (node: HTMLDivElement | null) => {
    if (node && !mapRef.current) { // Prevents re-initialization
      const map = L.map(node, {
          zoomControl: false // We can add custom zoom controls if needed
      }).setView([20.5937, 78.9629], 5);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Set z-index of the tile pane
      (map.getPane('tilePane') as HTMLElement).style.zIndex = '0';
      (map.getPane('shadowPane') as HTMLElement).style.zIndex = '0';
      (map.getPane('markerPane') as HTMLElement).style.zIndex = '1';
      (map.getPane('popupPane') as HTMLElement).style.zIndex = '2';

      problems.forEach(problem => {
        const marker = L.marker([problem.location.coordinates.lat, problem.location.coordinates.lng]).addTo(map);
        const totalLikes = problem.likes - problem.dislikes;
        
        const popupContent = `
            <div class="w-64">
              <div class="relative w-full h-32 mb-2 rounded-md overflow-hidden">
                <img src="https://picsum.photos/seed/${problem.media.images[0]}/600/400" alt="${problem.title}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <h3 class="font-bold text-lg mb-1">${problem.title}</h3>
              <p class="text-sm text-muted-foreground mb-2 line-clamp-2">${problem.description}</p>
              <div class="flex justify-between items-center">
                <span class="text-sm font-semibold">${totalLikes} Likes</span>
              </div>
            </div>
        `;

        marker.bindPopup(popupContent);

        L.circle([problem.location.coordinates.lat, problem.location.coordinates.lng], {
          radius: 20000,
          color: getDotColor(totalLikes),
          fillColor: getDotColor(totalLikes),
          fillOpacity: 0.5,
        }).addTo(map);
      });

      mapRef.current = map;
    }
  };

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapRef]);


  return (
    <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
  );
}
