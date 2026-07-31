'use client';

import { useState, useEffect } from 'react';
import { Plan, JoinRequest, ACTIVITIES, requestToJoinPlan } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
} from 'lucide-react';

// Mock current user
const CURRENT_USER_ID = 'user-123';
const CURRENT_USER_NAME = 'You';

// Mock host info - in real app, fetch from database
const PLAN_HOSTS: Record<string, { id: string; name: string; avatar: string }> = {
  '1': { id: 'host-1', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?img=1' },
  '2': { id: 'host-2', name: 'Mike', avatar: 'https://i.pravatar.cc/150?img=2' },
  '3': { id: 'host-3', name: 'Emma', avatar: 'https://i.pravatar.cc/150?img=3' },
  '4': { id: 'host-4', name: 'James', avatar: 'https://i.pravatar.cc/150?img=4' },
  '5': { id: 'host-5', name: 'Lisa', avatar: 'https://i.pravatar.cc/150?img=5' },
  '6': { id: 'host-6', name: 'Alex', avatar: 'https://i.pravatar.cc/150?img=6' },
  '7': { id: 'host-7', name: 'Tom', avatar: 'https://i.pravatar.cc/150?img=7' },
  '8': { id: 'host-8', name: 'Nina', avatar: 'https://i.pravatar.cc/150?img=8' },
};

// Mock join requests - in real app, fetch from database
const MOCK_JOIN_REQUESTS: Record<string, JoinRequest[]> = {
  '3': [
    {
      id: 'req-1',
      user_id: 'user-456',
      plan_id: '3',
      status: 'pending',
      user: { id: 'user-456', name: 'John', avatar_url: 'https://i.pravatar.cc/150?img=10' },
    },
    {
      id: 'req-2',
      user_id: 'user-789',
      plan_id: '3',
      status: 'pending',
      user: { id: 'user-789', name: 'Rachel', avatar_url: 'https://i.pravatar.cc/150?img=11' },
    },
  ],
  '5': [
    {
      id: 'req-3',
      user_id: 'user-999',
      plan_id: '5',
      status: 'pending',
      user: { id: 'user-999', name: 'Chris', avatar_url: 'https://i.pravatar.cc/150?img=12' },
    },
  ],
};

interface PlanDetailViewProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlanDetailView({ plan, isOpen, onClose }: PlanDetailViewProps) {
  const [hasRequested, setHasRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(
    MOCK_JOIN_REQUESTS[plan.id] || []
  );

  const host = PLAN_HOSTS[plan.id];
  const activity = ACTIVITIES[plan.activity];
  const isFull = plan.attendees_count >= plan.spots_available;
  const isHost = host?.id === CURRENT_USER_ID;
  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

  const handleRequestJoin = async () => {
    if (hasRequested || isLoading || isHost) return;

    setIsLoading(true);
    const success = await requestToJoinPlan(plan.id, CURRENT_USER_ID);
    setIsLoading(false);

    if (success) {
      setHasRequested(true);
    }
  };

  const handleApprove = (requestId: string, userId: string) => {
    setJoinRequests(prev =>
      prev.map(r =>
        r.id === requestId ? { ...r, status: 'approved' } : r
      )
    );
  };

  const handleDecline = (requestId: string) => {
    setJoinRequests(prev =>
      prev.map(r =>
        r.id === requestId ? { ...r, status: 'declined' } : r
      )
    );
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

            {/* Title and Host */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{plan.title}</h1>
              
              {host && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-4">
                  <img
                    src={host.avatar}
                    alt={host.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="text-sm text-slate-600">Hosted by</p>
                    <p className="font-semibold text-slate-900">{host.name}</p>
                  </div>
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
                    {new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={20} className="text-teal-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Time</p>
                  <p className="font-medium text-slate-900">{plan.time}</p>
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
                    width: `${(plan.attendees_count / plan.spots_available) * 100}%`,
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

            {/* Host View - Join Requests */}
            {isHost && pendingRequests.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-3">Pending Join Requests</h3>
                <div className="space-y-2">
                  {pendingRequests.map(request => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={request.user.avatar_url || 'https://i.pravatar.cc/150?img=99'}
                          alt={request.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-slate-900">{request.user.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(request.id, request.user_id)}
                          className="bg-teal-500 hover:bg-teal-600"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            {!isHost && (
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
          </div>
        </div>
      </div>
    </>
  );
}
