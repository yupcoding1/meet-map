'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import MyPlanCard from './MyPlanCard';
import { getHostedPlans, getJoinedPlans, getMyJoinRequests, getIncomingJoinRequests, approveJoinRequest, declineJoinRequest, updatePlan, deletePlan, type Plan } from '@/lib/dataUtils';
import { createClient } from '@/lib/supabase/client';
import { Users, ArrowRight, Check, X } from 'lucide-react';
import Link from 'next/link';
import CreatePlanModal from './CreatePlanModal';

type TabType = 'hosting' | 'joined' | 'requests';

interface IncomingRequest {
  plan: Plan;
  request: { id: string; status: string; created_at: string; plan_id: string; user_id: string };
  requester: { id: string; name: string; avatar_url?: string };
}

export default function MyPlansDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('hosting');
  const [hostedPlans, setHostedPlans] = useState<Plan[]>([]);
  const [joinedPlans, setJoinedPlans] = useState<Plan[]>([]);
  const [myRequests, setMyRequests] = useState<{ plan: Plan; request: any }[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please sign in to view your plans.');
          setLoading(false);
          return;
        }
        const [hosted, joined, myReqs, incomingReqs] = await Promise.all([
          getHostedPlans(user.id),
          getJoinedPlans(user.id),
          getMyJoinRequests(user.id),
          getIncomingJoinRequests(user.id),
        ]);
        setHostedPlans(hosted);
        setJoinedPlans(joined);
        setMyRequests(myReqs);
        setIncomingRequests(incomingReqs);
      } catch (err) {
        console.error('[MyPlansDashboard] Failed to load:', err);
        setError('Failed to load plans.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleApprove = async (requestId: string, userId: string) => {
    const success = await approveJoinRequest(requestId, userId);
    if (success) setIncomingRequests(prev => prev.filter(r => r.request.id !== requestId));
  };

  const handleDecline = async (requestId: string) => {
    const success = await declineJoinRequest(requestId);
    if (success) setIncomingRequests(prev => prev.filter(r => r.request.id !== requestId));
  };

  const handleEdit = (plan: Plan) => {
    console.log('[MyPlansDashboard] Editing plan:', plan.id);
    setEditingPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (plan: Plan) => {
    if (!window.confirm(`Delete "${plan.title}"? This will remove the plan, all join requests, participants, and chat messages.`)) return;
    console.log('[MyPlansDashboard] Deleting plan:', plan.id);
    const success = await deletePlan(plan.id);
    if (success) {
      setHostedPlans(prev => prev.filter(p => p.id !== plan.id));
      setIncomingRequests(prev => prev.filter(r => r.plan.id !== plan.id));
      console.log('[MyPlansDashboard] Plan deleted');
    } else {
      console.error('[MyPlansDashboard] Failed to delete plan');
    }
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'hosting', label: 'Hosting', count: hostedPlans.length },
    { id: 'joined', label: 'Joined', count: joinedPlans.length },
    { id: 'requests', label: 'Requests', count: myRequests.length + incomingRequests.length },
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
        return myRequests.map(r => r.plan);
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
        {activeTab === 'hosting' && (
          <>
            {incomingRequests.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Users size={18} />
                  Incoming Requests ({incomingRequests.length})
                </h3>
                <div className="space-y-2">
                  {incomingRequests.map(req => (
                    <div key={req.request.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xs font-semibold">
                          {req.requester.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{req.requester.name}</span>
                          <span className="text-sm text-slate-500 ml-2">wants to join "{req.plan.title}"</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(req.request.id, req.request.user_id)} className="bg-teal-500 hover:bg-teal-600">
                          <Check size={14} className="mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecline(req.request.id)} className="text-red-600 border-red-200">
                          <X size={14} className="mr-1" />Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hostedPlans.length === 0 ? renderEmptyState('hosting') : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostedPlans.map(plan => (
                  <MyPlanCard
                    key={plan.id}
                    plan={plan}
                    status={plan.attendees_count >= plan.spots_available ? 'Full' : 'Upcoming'}
                    tab="hosting"
                    incomingRequestCount={incomingRequests.filter(r => r.plan.id === plan.id).length}
                    onViewRequests={() => setActiveTab('requests')}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'joined' && (
          joinedPlans.length === 0 ? renderEmptyState('joined') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedPlans.map(plan => (
                <MyPlanCard key={plan.id} plan={plan} status="Upcoming" tab="joined" />
              ))}
            </div>
          )
        )}

        {activeTab === 'requests' && (
          myRequests.length === 0 && incomingRequests.length === 0 ? renderEmptyState('requests') : (
            <div className="space-y-6">
              {myRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">My Pending Requests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRequests.map(({ plan, request }) => (
                      <MyPlanCard key={request.id} plan={plan} status="Pending approval" tab="requests" />
                    ))}
                  </div>
                </div>
              )}
              {incomingRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Incoming Requests</h3>
                  <div className="space-y-3">
                    {incomingRequests.map(req => (
                      <div key={req.request.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold">
                            {req.requester.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{req.requester.name}</p>
                            <p className="text-sm text-slate-500">wants to join <span className="font-medium">{req.plan.title}</span></p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(req.request.id, req.request.user_id)} className="bg-teal-500 hover:bg-teal-600">
                            <Check size={14} className="mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDecline(req.request.id)} className="text-red-600 border-red-200">
                            <X size={14} className="mr-1" />Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Edit Plan Modal */}
      <CreatePlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        planToEdit={editingPlan}
        onUpdate={async (updatedPlan) => {
          if (editingPlan) {
            const result = await updatePlan(editingPlan.id, updatedPlan);
            if (result) {
              setHostedPlans(prev => prev.map(p => p.id === result.id ? result : p));
              console.log('[MyPlansDashboard] Plan updated:', result.id);
            }
          }
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
}
