
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Problem } from '@/lib/definitions';
import { useEffect, memo } from 'react';
import type { MutableRefObject } from 'react';
import { createRoot } from 'react-dom/client';
import { ProblemPopup } from '@/components/problem-popup';
import { useProblems } from '@/context/problem-context';

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
  onProblemSelect: (problem: Problem) => void;
}

const getDotColor = (likeCount: number) => {
    if (likeCount >= 5) return 'red';
    if (likeCount >= 3) return 'orange';
    if (likeCount >= 1) return 'yellow';
    return '#A9A9A9';
};

const MapView = memo(function MapView({ problems, mapRef, onProblemSelect }: MapViewProps) {
  const { voteOnProblem } = useProblems();

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
        
        const popupContainer = document.createElement('div');
        const root = createRoot(popupContainer);
        root.render(<ProblemPopup problem={problem} voteOnProblem={voteOnProblem} onViewDetails={() => onProblemSelect(problem)} />);
        
        marker.bindPopup(popupContainer);

        const totalLikes = problem.likes - problem.dislikes;
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
});

export default MapView;
