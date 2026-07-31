'use client';

import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpotsSelectorProps {
  value: number;
  onChange: (spots: number) => void;
}

export default function SpotsSelector({
  value,
  onChange,
}: SpotsSelectorProps) {
  const handleDecrease = () => {
    if (value > 2) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < 10) onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDecrease}
        disabled={value <= 2}
        className="h-9 w-9 p-0"
      >
        <Minus size={18} />
      </Button>

      <div className="flex-1 text-center">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-600">spots</div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleIncrease}
        disabled={value >= 10}
        className="h-9 w-9 p-0"
      >
        <Plus size={18} />
      </Button>
    </div>
  );
}
