'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import GroupChat from '@/components/GroupChat';
import { mockPlans } from '@/lib/dataUtils';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const [plan, setPlan] = useState<typeof mockPlans[0] | null>(null);

  useEffect(() => {
    if (params.planId) {
      const foundPlan = mockPlans.find(p => p.id === params.planId);
      setPlan(foundPlan || null);
    }
  }, [params.planId]);

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Plan not found</h1>
          <p className="text-slate-600 mb-6">The plan you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <GroupChat plan={plan} onClose={() => router.push('/')} />
  );
}
