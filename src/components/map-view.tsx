
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Problem } from '@/lib/definitions';
import { useEffect, memo, useRef } from 'react';
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

const getPinColor = (status: Problem['status']) => {
    switch (status) {
        case 'Resolved':
            return 'green';
        case 'In Progress':
            return 'blue';
        case 'Registered':
            return 'yellow';
        case 'Rejected':
            return 'grey';
        case 'Awaiting Approval':
        default:
            return 'red';
    }
}

const createColoredIcon = (color: string) => {
    const markerHtmlStyles = `
        background-color: ${color};
        width: 2rem;
        height: 2rem;
        display: block;
        left: -1rem;
        top: -1rem;
        position: relative;
        border-radius: 2rem 2rem 0;
        transform: rotate(45deg);
        border: 1px solid #FFFFFF;
    `;

    return L.divIcon({
        className: "my-custom-pin",
        iconAnchor: [0, 24],
        popupAnchor: [0, -36],
        html: `<span style="${markerHtmlStyles}" />`
    });
};


const MapView = memo(function MapView({ problems, mapRef, onProblemSelect }: MapViewProps) {
  const { voteOnProblem } = useProblems();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      
      layersRef.current = L.layerGroup().addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapRef]);

  // Update markers when problems change
  useEffect(() => {
    if (layersRef.current) {
      layersRef.current.clearLayers(); // Clear old markers

      problems.forEach(problem => {
        if (problem.location.coordinates && problem.location.coordinates.lat && problem.location.coordinates.lng) {
          const marker = L.marker([problem.location.coordinates.lat, problem.location.coordinates.lng], {
            icon: createColoredIcon(getPinColor(problem.status))
          }).addTo(layersRef.current!);
          
          const popupContainer = document.createElement('div');
          
          // The popup is rendered via a separate React root to ensure it has its own lifecycle.
          const root = createRoot(popupContainer);
          root.render(<ProblemPopup problem={problem} voteOnProblem={voteOnProblem} onViewDetails={() => onProblemSelect(problem)} />);
          
          marker.bindPopup(popupContainer);
        }
      });
    }
  }, [problems, onProblemSelect, voteOnProblem]);


  return (
    <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
  );
});

export default MapView;
