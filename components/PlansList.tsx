'use client';

import { type Plan } from '@/lib/dataUtils';
import PlanCard from './PlanCard';

interface PlansListProps {
  plans: Plan[];
  selectedPlanId?: string;
  onPlanSelect: (planId: string) => void;
  onPlanClick?: (plan: Plan) => void;
}

export default function PlansList({
  plans,
  selectedPlanId,
  onPlanSelect,
  onPlanClick,
}: PlansListProps) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="text-slate-400 text-6xl">🗺️</div>
        <p className="text-slate-600 font-medium">No plans found</p>
        <p className="text-slate-500 text-sm">
          Try adjusting your filters to discover more activities nearby
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 auto-rows-max">
      {plans.map((plan) => (
        <div
          key={plan.id}
          onClick={() => {
            onPlanSelect(plan.id);
            onPlanClick?.(plan);
          }}
        >
          <PlanCard
            plan={plan}
            isSelected={plan.id === selectedPlanId}
            onClick={() => {}}
          />
        </div>
      ))}
    </div>
  );
}
