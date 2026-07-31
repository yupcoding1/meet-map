'use client';

import { ACTIVITIES, type ActivityType } from '@/lib/dataUtils';
import { MapPin, Calendar, Clock, Users } from 'lucide-react';

interface PlanPreviewCardProps {
  venue?: string;
  activity: ActivityType;
  date: string;
  time: string;
  spots: number;
  description: string;
}

export default function PlanPreviewCard({
  venue,
  activity,
  date,
  time,
  spots,
  description,
}: PlanPreviewCardProps) {
  const activityInfo = ACTIVITIES[activity];

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Select a date';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    return timeStr;
  };

  const isComplete = venue && date && time;

  return (
    <div
      className={`rounded-2xl overflow-hidden border-2 transition-all ${
        isComplete
          ? 'border-slate-200 shadow-md'
          : 'border-dashed border-slate-300 bg-slate-50/50'
      }`}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
        {isComplete ? (
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop"
            alt="Plan preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-400 text-sm">Preview</span>
          </div>
        )}
        {isComplete && (
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activityInfo.color}`}>
              {activityInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-lg text-slate-900 line-clamp-2 min-h-7">
          {isComplete
            ? `${activityInfo.label} at ${venue}`
            : 'Your plan title'}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-2">
            {description}
          </p>
        )}

        {/* Location */}
        {venue && (
          <div className="flex items-center gap-2 text-slate-600 text-sm mt-3">
            <MapPin size={16} />
            <span className="line-clamp-1">{venue}</span>
          </div>
        )}

        {/* Meta Info */}
        <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Calendar size={16} />
            <span>{formatDate(date)}</span>
            <Clock size={16} className="ml-2" />
            <span>{formatTime(time)}</span>
          </div>

          {/* Spots */}
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Users size={16} />
            <span>{spots} spots available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
