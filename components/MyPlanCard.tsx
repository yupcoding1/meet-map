'use client';

import { ACTIVITIES, type Plan } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, MoreVertical, Check, X, MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface MyPlanCardProps {
  plan: Plan;
  status: 'Upcoming' | 'Pending approval' | 'Full' | 'Completed';
  tab: 'hosting' | 'joined' | 'requests';
  incomingRequestCount?: number;
  onViewRequests?: () => void;
  onEdit?: (plan: Plan) => void;
  onDelete?: (plan: Plan) => void;
}

export default function MyPlanCard({ plan, status, tab, incomingRequestCount = 0, onViewRequests, onEdit, onDelete }: MyPlanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const activity = ACTIVITIES[plan.activity] || { label: 'General', color: 'bg-slate-100 text-slate-800' };

  const getStatusColor = () => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending approval':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Full':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Completed':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Upcoming':
        return null;
      case 'Pending approval':
        return <Clock size={14} />;
      case 'Full':
        return <X size={14} />;
      case 'Completed':
        return <Check size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
        <img
          src={plan.image_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop'}
          alt={plan.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full ${activity.color}`}>
            {activity.label}
          </span>
        </div>
        <div className={`absolute top-3 right-3 px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor()} flex items-center gap-1`}>
          {getStatusIcon()}
          {status}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">{plan.title}</h3>

        {/* Meta Info */}
        <div className="space-y-2 mb-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="flex-shrink-0" />
            <span>{plan.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="flex-shrink-0" />
            <span>{plan.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="line-clamp-1">{plan.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="flex-shrink-0" />
            <span>
              {plan.attendees_count}/{plan.spots_available} spots
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {plan.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          {tab === 'hosting' && status !== 'Full' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewRequests}
                className="flex-1 rounded-lg"
              >
                View Requests
                {incomingRequestCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-semibold bg-blue-500 text-white rounded-full">
                    {incomingRequestCount}
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => onEdit?.(plan)}
                className="flex-1 rounded-lg"
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete?.(plan)}
                className="rounded-lg text-red-600 border-red-200 hover:border-red-300"
                title="Delete plan"
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}

          {tab === 'hosting' && status === 'Full' && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={onViewRequests}
                className="flex-1 rounded-lg"
              >
                View Requests
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete?.(plan)}
                className="rounded-lg text-red-600 border-red-200 hover:border-red-300"
                title="Delete plan"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}

          {tab === 'joined' && (
            <>
              <Link href={`/chat/${plan.id}`} className="flex-1">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full rounded-lg gap-1"
                >
                  <MessageCircle size={14} />
                  Chat
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                Leave
              </Button>
            </>
          )}

          {tab === 'requests' && status === 'Pending approval' && (
            <>
              <Button
                size="sm"
                className="flex-1 rounded-lg gap-1 bg-green-600 hover:bg-green-700"
              >
                <Check size={14} />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg text-red-600 hover:text-red-700"
              >
                <X size={14} />
                Decline
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
