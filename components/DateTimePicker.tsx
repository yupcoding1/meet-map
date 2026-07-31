'use client';

import { Calendar, Clock } from 'lucide-react';

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export default function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: DateTimePickerProps) {
  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {/* Date */}
      <div className="relative">
        <Calendar
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          min={today}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900"
        />
      </div>

      {/* Time */}
      <div className="relative">
        <Clock
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900"
        />
      </div>
    </div>
  );
}
