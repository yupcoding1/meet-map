'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { name: string; lat: number; lng: number } | null;
}

export default function MapPicker({
  onLocationSelect,
  selectedLocation,
}: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      const container = document.getElementById('map-picker-container');
      if (!container) return;

      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      const center: [number, number] = [40.7128, -74.006];
      const map = L.map('map-picker-container').setView(center, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        console.log('[MapPicker] Map clicked:', { lat, lng });

        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add new marker
        const marker = L.marker([lat, lng]).addTo(map);
        markerRef.current = marker;

        // Call the callback
        onLocationSelect(lat, lng);
      });

      mapRef.current = map;
    }

    return () => {
      // Don't destroy the map on unmount
    };
  }, [onLocationSelect]);

  // Update marker when selectedLocation changes externally
  useEffect(() => {
    if (!mapRef.current || !selectedLocation || selectedLocation.lat === 0) return;

    const map = mapRef.current;

    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    // Add new marker
    const marker = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
    markerRef.current = marker;

    // Center map on the location
    map.setView([selectedLocation.lat, selectedLocation.lng], 14);
  }, [selectedLocation]);

  return (
    <div
      id="map-picker-container"
      className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
      style={{ minHeight: '192px', cursor: 'crosshair' }}
    />
  );
}