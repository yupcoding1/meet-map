'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { type Plan, ACTIVITIES } from '@/lib/dataUtils';
import 'leaflet/dist/leaflet.css';

interface MapContentProps {
  plans: Plan[];
  selectedPlanId?: string;
  onPlanSelect: (planId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapContent({
  plans,
  selectedPlanId,
  onPlanSelect,
  userLocation,
}: MapContentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) {
      const container = document.getElementById('map-container');
      if (!container) return;

      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      const center: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : [40.7505, -73.9680];
      const map = L.map('map-container').setView(center, 13);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      mapRef.current = map;
    }

    return () => {
      // Don't destroy the map on unmount to prevent strict mode issues
    };
  }, []);

  // Re-center map and update user marker when userLocation changes
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const map = mapRef.current;
    console.log('[MapContent] Re-centering map to user location:', userLocation);

    // Center map on user's location
    map.setView([userLocation.lat, userLocation.lng], 13);

    // Remove old user marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    // Add new user marker
    const userIcon = L.divIcon({
      html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindPopup('<div class="p-2"><p class="text-sm font-medium">Your location</p></div>')
      .addTo(map);
    userMarkerRef.current = userMarker;
  }, [userLocation]);

  // Update markers when plans change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    plans.forEach((plan) => {
      const isSelected = plan.id === selectedPlanId;
      const activity = ACTIVITIES[plan.activity];

      const icon = isSelected
        ? L.divIcon({
            html: `<div class="w-8 h-8 bg-teal-500 rounded-full border-2 border-white shadow-md flex items-center justify-center"><span class="text-white text-xs font-bold">${plans.indexOf(plan) + 1}</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        : L.icon({
            iconUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

      const marker = L.marker([plan.lat, plan.lng], { icon })
        .bindPopup(
          `<div class="p-3"><h3 class="font-semibold text-sm">${plan.title}</h3><p class="text-xs text-gray-600">${plan.location}</p></div>`
        )
        .on('click', () => onPlanSelect(plan.id))
        .addTo(map);

      markersRef.current[plan.id] = marker;
    });
  }, [plans, selectedPlanId, onPlanSelect]);

  return (
    <div
      id="map-container"
      className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200"
      style={{ minHeight: '400px' }}
    />
  );
}
