'use client';

import { ACTIVITIES, type Plan } from '@/lib/dataUtils';
import { Users, MapPin, Calendar } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onClick: () => void;
}

export default function PlanCard({ plan, isSelected, onClick }: PlanCardProps) {
  const activity = ACTIVITIES[plan.activity];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
        isSelected
          ? 'border-teal-500 shadow-lg scale-105'
          : 'border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300'
      }`}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
        <img
          src={plan.image_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop'}
          alt={plan.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activity.color}`}>
            {activity.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-900 line-clamp-2">
          {plan.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 mt-1">
          {plan.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-1 text-slate-500 text-xs mt-3">
          <MapPin size={14} />
          <span className="line-clamp-1">{plan.location}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-600 text-xs">
            <Users size={14} />
            <span>{plan.attendees_count} joined</span>
          </div>
          <div className="text-xs text-teal-600 font-semibold">
            {plan.spots_available - plan.attendees_count} spots left
          </div>
        </div>
      </div>
    </div>
  );
}
