'use client';

import { useState, useEffect } from 'react';
import { Plan, ACTIVITIES, requestToJoinPlan } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
} from 'lucide-react';

interface PlanDetailViewProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlanDetailView({ plan, isOpen, onClose }: PlanDetailViewProps) {
  const [hasRequested, setHasRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      console.log('[PlanDetailView] Loading user for plan:', plan.id);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('[PlanDetailView] Current user:', user.id);
        setCurrentUserId(user.id);
        if (plan.host_id === user.id) {
          setIsHost(true);
          console.log('[PlanDetailView] User is the host');
        }
      }
    };
    loadUser();
  }, [plan.id, plan.host_id]);

  const activity = ACTIVITIES[plan.activity] || { label: 'General', color: 'bg-slate-100 text-slate-800' };
  const isFull = plan.attendees_count >= plan.spots_available;

  const handleRequestJoin = async () => {
    if (hasRequested || isLoading || isHost || !currentUserId) return;

    console.log('[PlanDetailView] Requesting to join plan:', plan.id);
    setIsLoading(true);
    const result = await requestToJoinPlan(plan.id, currentUserId);
    setIsLoading(false);

    if (result) {
      console.log('[PlanDetailView] Join request sent successfully');
      setHasRequested(true);
    } else {
      console.error('[PlanDetailView] Failed to send join request');
    }
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 md:p-6 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {/* Hero Image */}
            <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-slate-200 to-slate-300">
              <img
                src={plan.image_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop'}
                alt={plan.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${activity.color}`}>
                  {activity.label}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{plan.title}</h1>
              {isHost && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-800 font-medium">You are hosting this plan</p>
                </div>
              )}
            </div>

            {/* Location, Date, Time */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-teal-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Location</p>
                  <p className="font-medium text-slate-900">{plan.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-teal-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Date</p>
                  <p className="font-medium text-slate-900">
                    {plan.date ? new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    }) : 'TBD'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={20} className="text-teal-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Time</p>
                  <p className="font-medium text-slate-900">{plan.time || 'TBD'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {plan.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">About this plan</h3>
                <p className="text-slate-600 leading-relaxed">{plan.description}</p>
              </div>
            )}

            {/* Attendees Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-teal-500" />
                  Attendees
                </h3>
                <span className="text-sm text-slate-600">
                  {plan.attendees_count}/{plan.spots_available} spots filled
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300"
                    style={{
                      width: `${plan.spots_available > 0 ? (plan.attendees_count / plan.spots_available) * 100 : 0}%`,
                    }}
                  />
              </div>

              {/* Attendee Avatars */}
              <div className="flex items-center gap-2 flex-wrap">
                {Array.from({ length: Math.min(plan.attendees_count, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-semibold"
                  >
                    {i + 1}
                  </div>
                ))}
                {plan.attendees_count > 5 && (
                  <div className="text-sm text-slate-600 ml-2">
                    +{plan.attendees_count - 5} more
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            {!isHost && currentUserId && (
              <div className="mt-6">
                {isFull ? (
                  <Button disabled className="w-full" size="lg">
                    Plan Full
                  </Button>
                ) : hasRequested ? (
                  <Button disabled className="w-full" size="lg" variant="outline">
                    Request Sent
                  </Button>
                ) : (
                  <Button
                    onClick={handleRequestJoin}
                    disabled={isLoading}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                    size="lg"
                  >
                    {isLoading ? 'Sending...' : 'Request to Join'}
                  </Button>
                )}
              </div>
            )}

            {!currentUserId && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-sm text-amber-800">Sign in to request joining this plan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
