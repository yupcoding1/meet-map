'use client';

import { type ActivityType, ACTIVITIES } from '@/lib/dataUtils';
import {
  Coffee,
  Mountain,
  Utensils,
  ShoppingBag,
  Palette,
  Zap,
} from 'lucide-react';

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  coffee: <Coffee size={24} />,
  hiking: <Mountain size={24} />,
  dining: <Utensils size={24} />,
  shopping: <ShoppingBag size={24} />,
  cultural: <Palette size={24} />,
  sports: <Zap size={24} />,
};

interface ActivitySelectorProps {
  value: ActivityType;
  onChange: (activity: ActivityType) => void;
}

export default function ActivitySelector({
  value,
  onChange,
}: ActivitySelectorProps) {
  const activities = Object.entries(ACTIVITIES) as Array<
    [ActivityType, { label: string; color: string }]
  >;

  return (
    <div className="grid grid-cols-3 gap-3">
      {activities.map(([activity, { label, color }]) => (
        <button
          key={activity}
          onClick={() => onChange(activity)}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
            value === activity
              ? 'border-teal-500 bg-teal-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              value === activity
                ? 'bg-teal-100 text-teal-600'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {ACTIVITY_ICONS[activity]}
          </div>
          <span className="text-xs font-semibold text-slate-900">{label}</span>
        </button>
      ))}
    </div>
  );
}
