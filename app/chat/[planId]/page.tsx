'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import GroupChat from '@/components/GroupChat';
import { getPlanById, type Plan } from '@/lib/dataUtils';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.planId) {
      console.log(`[ChatPage] Fetching plan with ID: ${params.planId}`);
      setLoading(true);
      getPlanById(params.planId as string)
        .then((data) => {
          console.log('[ChatPage] Plan fetched:', data ? 'found' : 'not found');
          setPlan(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('[ChatPage] Error fetching plan:', err);
          setLoading(false);
        });
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
