'use client';

import dynamic from 'next/dynamic';
import { type Plan } from '@/lib/dataUtils';

const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-2xl">
      <div className="text-slate-500">Loading map...</div>
    </div>
  ),
});

interface MapComponentProps {
  plans: Plan[];
  selectedPlanId?: string;
  onPlanSelect: (planId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapComponent({
  plans,
  selectedPlanId,
  onPlanSelect,
  userLocation,
}: MapComponentProps) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg" suppressHydrationWarning>
      <MapContent
        key={selectedPlanId}
        plans={plans}
        selectedPlanId={selectedPlanId}
        onPlanSelect={onPlanSelect}
        userLocation={userLocation}
      />
    </div>
  );
}
