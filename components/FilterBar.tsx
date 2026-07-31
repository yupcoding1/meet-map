'use client';

import { ActivityType, ACTIVITIES } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  selectedActivity?: ActivityType;
  selectedDistance: number;
  onActivityChange: (activity?: ActivityType) => void;
  onDistanceChange: (distance: number) => void;
}

export default function FilterBar({
  selectedActivity,
  selectedDistance,
  onActivityChange,
  onDistanceChange,
}: FilterBarProps) {
  const activities: ActivityType[] = ['coffee', 'hiking', 'dining', 'shopping', 'cultural', 'sports'];

  return (
    <div className="flex flex-col gap-4">
      {/* Activity Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedActivity === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => onActivityChange(undefined)}
          className="rounded-full"
        >
          All
        </Button>
        {activities.map((activity) => (
          <Button
            key={activity}
            variant={selectedActivity === activity ? 'default' : 'outline'}
            size="sm"
            onClick={() => onActivityChange(activity)}
            className="rounded-full"
          >
            {ACTIVITIES[activity].label}
          </Button>
        ))}
      </div>

      {/* Distance Filter */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Distance: {selectedDistance}km
          </label>
          <span className="text-xs text-slate-500">
            {selectedDistance === 10 ? 'Any distance' : `Within ${selectedDistance}km`}
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={selectedDistance}
          onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
        />
      </div>
    </div>
  );
}
