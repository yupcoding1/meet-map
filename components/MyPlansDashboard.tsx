'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import MyPlanCard from './MyPlanCard';
import { getPlans, type Plan } from '@/lib/dataUtils';
import { Calendar, Users, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type TabType = 'hosting' | 'joined' | 'requests';

export default function MyPlansDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('hosting');
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans from Supabase on mount
  useEffect(() => {
    console.log('[MyPlansDashboard] Component mounted, fetching plans from Supabase...');
    setLoading(true);
    setError(null);
    
    getPlans()
      .then((data) => {
        console.log(`[MyPlansDashboard] Plans loaded successfully: ${data.length} plans`);
        setAllPlans(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[MyPlansDashboard] Failed to load plans:', err);
        setError('Failed to load plans from database.');
        setLoading(false);
      });
  }, []);

  // For now, show all plans (in production, filter by user ID)
  const hostedPlans: Plan[] = allPlans;
  const joinedPlans: Plan[] = [];
  const requestPlans: Plan[] = [];

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'hosting', label: 'Hosting', count: hostedPlans.length },
    { id: 'joined', label: 'Joined', count: joinedPlans.length },
    { id: 'requests', label: 'Requests', count: requestPlans.length },
  ];

  const renderEmptyState = (tab: TabType) => {
    const emptyStates = {
      hosting: {
        title: 'No plans hosted yet',
        description: 'Start bringing people together by creating your first plan.',
        buttonText: 'Create a Plan',
        buttonHref: '/?create=true',
      },
      joined: {
        title: 'You haven\u2019t joined any plans yet',
        description: 'Explore nearby plans and join the community.',
        buttonText: 'Discover Plans',
        buttonHref: '/',
      },
      requests: {
        title: 'No pending requests',
        description: 'Once you request to join a plan, they\u2019ll appear here.',
        buttonText: 'Find Plans to Join',
        buttonHref: '/',
      },
    };

    const state = emptyStates[tab];

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">{state.title}</h3>
          <p className="text-slate-600 mb-6">{state.description}</p>
          <Link href={state.buttonHref}>
            <Button className="rounded-lg gap-2">
              {state.buttonText}
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  const getPlansForTab = () => {
    switch (activeTab) {
      case 'hosting':
        return hostedPlans;
      case 'joined':
        return joinedPlans;
      case 'requests':
        return requestPlans;
      default:
        return [];
    }
  };

  const plans = getPlansForTab();
  const isEmpty = plans.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-red-200">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} className="rounded-lg">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-8 flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? 'text-teal-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-teal-100 text-teal-600 rounded-full">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {isEmpty ? (
          renderEmptyState(activeTab)
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              let status = 'Upcoming';
              if (activeTab === 'hosting' && plan.attendees_count >= plan.spots_available) {
                status = 'Full';
              } else if (activeTab === 'requests') {
                status = 'Pending approval';
              } else if (activeTab === 'joined') {
                status = 'Upcoming';
              }

              return (
                <MyPlanCard
                  key={plan.id}
                  plan={plan}
                  status={status}
                  tab={activeTab}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}