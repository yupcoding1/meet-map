'use client';

import { useState, useMemo } from 'react';
import { X, MapPin, Calendar, Users, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ACTIVITIES, type ActivityType, createPlan } from '@/lib/dataUtils';
import VenueSearch from './VenueSearch';
import ActivitySelector from './ActivitySelector';
import DateTimePicker from './DateTimePicker';
import SpotsSelector from './SpotsSelector';
import PlanPreviewCard from './PlanPreviewCard';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (plan: any) => void;
}

export default function CreatePlanModal({
  isOpen,
  onClose,
  onCreate,
}: CreatePlanModalProps) {
  const [venue, setVenue] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [activity, setActivity] = useState<ActivityType>('coffee');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [spots, setSpots] = useState(4);
  const [description, setDescription] = useState('');

  // Determine if required fields are filled
  const isFormValid = useMemo(() => {
    return selectedVenue && activity && date && time && spots >= 2 && spots <= 10;
  }, [selectedVenue, activity, date, time, spots]);

  const handleCreate = () => {
    if (!isFormValid) return;

    const newPlan = {
      id: `plan-${Date.now()}`,
      title: `${ACTIVITIES[activity].label} at ${selectedVenue.name}`,
      description: description || `Join us for a ${activity} experience!`,
      location: selectedVenue.name,
      lat: selectedVenue.lat,
      lng: selectedVenue.lng,
      activity,
      date,
      time,
      distance: selectedVenue.distance,
      attendees: 1,
      spotTotal: spots,
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    };

    onCreate?.(newPlan);
    onClose();
    // Reset form
    setVenue('');
    setSelectedVenue(null);
    setActivity('coffee');
    setDate('');
    setTime('14:00');
    setSpots(4);
    setDescription('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between rounded-t-3xl">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Create a Plan</h2>
              <p className="text-sm text-slate-600 mt-1">
                Share what you&apos;re planning and find your people
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              {/* Venue Search */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Where are you planning?
                </label>
                <VenueSearch
                  value={venue}
                  onChange={setVenue}
                  onSelect={setSelectedVenue}
                  selectedVenue={selectedVenue}
                />
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  What activity?
                </label>
                <ActivitySelector
                  value={activity}
                  onChange={setActivity}
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    When?
                  </label>
                  <DateTimePicker
                    date={date}
                    time={time}
                    onDateChange={setDate}
                    onTimeChange={setTime}
                  />
                </div>

                {/* Spots */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Spots available
                  </label>
                  <SpotsSelector
                    value={spots}
                    onChange={setSpots}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-900">
                    Tell us more (optional)
                  </label>
                  <span className="text-xs text-slate-500">
                    {description.length}/200
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, 200))
                  }
                  placeholder="Add details about your plan..."
                  className="w-full h-24 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none bg-white text-slate-900 placeholder-slate-500"
                />
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreate}
                disabled={!isFormValid}
                size="lg"
                className="w-full rounded-xl"
              >
                Create Plan
              </Button>
            </div>

            {/* Preview - Desktop */}
            <div className="hidden lg:flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Preview
                </h3>
                <PlanPreviewCard
                  venue={selectedVenue?.name}
                  activity={activity}
                  date={date}
                  time={time}
                  spots={spots}
                  description={description}
                />
              </div>
            </div>
          </div>

          {/* Preview - Mobile */}
          <div className="lg:hidden px-6 pb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Preview
            </h3>
            <PlanPreviewCard
              venue={selectedVenue?.name}
              activity={activity}
              date={date}
              time={time}
              spots={spots}
              description={description}
            />
          </div>
        </div>
      </div>
    </>
  );
}
