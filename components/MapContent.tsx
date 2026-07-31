'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { type Plan, ACTIVITIES } from '@/lib/dataUtils';
import 'leaflet/dist/leaflet.css';

interface MapContentProps {
  plans: Plan[];
  selectedPlanId?: string;
  onPlanSelect: (planId: string) => void;
}

export default function MapContent({
  plans,
  selectedPlanId,
  onPlanSelect,
}: MapContentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current) {
      const container = document.getElementById('map-container');
      if (!container) return;

      // Remove any existing map
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      const center: [number, number] = [40.7505, -73.9680];
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
