'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, MapPin, Calendar, Users, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ACTIVITIES, type ActivityType, createPlan, type Plan } from '@/lib/dataUtils';
import LocationPicker, { type SelectedLocation } from './LocationPicker';
import ActivitySelector from './ActivitySelector';
import DateTimePicker from './DateTimePicker';
import SpotsSelector from './SpotsSelector';
import PlanPreviewCard from './PlanPreviewCard';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (plan: any) => void;
  planToEdit?: Plan | null;
  onUpdate?: (updates: Partial<Omit<Plan, 'id'>>) => Promise<void>;
}

export default function CreatePlanModal({
  isOpen,
  onClose,
  onCreate,
  planToEdit,
  onUpdate,
}: CreatePlanModalProps) {
  const [venue, setVenue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [activity, setActivity] = useState<ActivityType>('coffee');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [spots, setSpots] = useState(4);
  const [description, setDescription] = useState('');

  // Initialize form with plan data when editing
  useEffect(() => {
    if (planToEdit) {
      console.log('[CreatePlanModal] Initializing edit mode for plan:', planToEdit.id);
      setVenue(planToEdit.location);
      setSelectedLocation({ name: planToEdit.location, lat: planToEdit.lat, lng: planToEdit.lng });
      setActivity(planToEdit.activity);
      setDate(planToEdit.date);
      setTime(planToEdit.time);
      setSpots(planToEdit.spots_available);
      setDescription(planToEdit.description);
    } else {
      setVenue('');
      setSelectedLocation(null);
      setActivity('coffee');
      setDate('');
      setTime('14:00');
      setSpots(4);
      setDescription('');
    }
  }, [planToEdit, isOpen]);

  // Determine if required fields are filled
  const isFormValid = useMemo(() => {
    return selectedLocation && selectedLocation.lat !== 0 && activity && date && time && spots >= 2 && spots <= 10;
  }, [selectedLocation, activity, date, time, spots]);

  const handleCreate = async () => {
    if (!isFormValid) return;

    if (!selectedLocation || selectedLocation.lat === 0) {
      console.error('[CreatePlanModal] No location selected');
      return;
    }

    const planData = {
      title: `${ACTIVITIES[activity].label} at ${selectedLocation.name}`,
      description: description || `Join us for a ${activity} experience!`,
      location: selectedLocation.name,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      activity,
      date,
      time,
      spots_available: spots,
      attendees_count: 1,
    };

    if (planToEdit && onUpdate) {
      // Edit mode
      console.log('[CreatePlanModal] Updating plan:', planToEdit.id);
      await onUpdate(planData);
    } else {
      // Create mode
      console.log('[CreatePlanModal] Creating plan...');
      const result = await createPlan(planData);
      if (result) {
        console.log('[CreatePlanModal] Plan created successfully:', result.id);
        onCreate?.(result);
      } else {
        console.error('[CreatePlanModal] Failed to create plan');
      }
    }
    
    onClose();
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
                <LocationPicker
                  value={venue}
                  onChange={setVenue}
                  onSelect={setSelectedLocation}
                  selectedLocation={selectedLocation}
                  placeholder="Enter a place name and click on the map..."
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

              {/* Create/Update Button */}
              <Button
                onClick={handleCreate}
                disabled={!isFormValid}
                size="lg"
                className="w-full rounded-xl"
              >
                {planToEdit ? 'Save Changes' : 'Create Plan'}
              </Button>
            </div>

            {/* Preview - Desktop */}
            <div className="hidden lg:flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Preview
                </h3>
                <PlanPreviewCard
                  venue={selectedLocation?.name}
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
              venue={selectedLocation?.name}
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
