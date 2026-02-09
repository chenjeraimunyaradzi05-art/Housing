'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  title: string;
  height?: string;
}

export function PropertyMap({
  latitude,
  longitude,
  address,
  title,
  height = '400px',
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    // Only initialize if we have coordinates
    if (!latitude || !longitude || !mapContainer.current) {
      return;
    }

    // Set mapbox token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn('NEXT_PUBLIC_MAPBOX_TOKEN is not configured');
      return;
    }

    mapboxgl.accessToken = token;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [Number(longitude), Number(latitude)],
      zoom: 15,
    });

    // Add marker
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundImage =
      'url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjZTExZDQ4Ii8+PHBhdGggZD0iTTI0IDE2QzIwLjY4NiAxNiAxOCAxOC42ODYgMTggMjJDMTggMjYuNDExIDI0IDMyIDI0IDMyQzI0IDMyIDMwIDI2LjQxIDMwIDIyQzMwIDE4LjY4NiAyNy4zMTQgMTYgMjQgMTZaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==\')';
    el.style.backgroundSize = 'contain';
    el.style.cursor = 'pointer';

    marker.current = new mapboxgl.Marker(el)
      .setLngLat([Number(longitude), Number(latitude)])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="font-weight: 600; margin: 4px 0;">${title}</div><div style="font-size: 12px; color: #666;">${address}</div>`
        )
      )
      .addTo(map.current);

    // Show popup on load
    marker.current.togglePopup();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, address, title]);

  // If no coordinates, show placeholder
  if (!latitude || !longitude) {
    return (
      <div
        style={{ height, backgroundColor: '#f0f0f0' }}
        className="rounded-lg flex items-center justify-center text-gray-500"
      >
        Location coordinates not available
      </div>
    );
  }

  return <div ref={mapContainer} style={{ height }} className="rounded-lg overflow-hidden" />;
}
