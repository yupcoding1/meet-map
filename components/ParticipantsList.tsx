'use client';

import { Participant } from '@/lib/dataUtils';
import { X } from 'lucide-react';

interface ParticipantsListProps {
  participants: Participant[];
  onClose: () => void;
}

export default function ParticipantsList({
  participants,
  onClose,
}: ParticipantsListProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Participants ({participants.length})
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Participants List */}
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold bg-teal-100 text-teal-900 overflow-hidden">
                  {participant.avatar_url ? (
                    <img
                      src={participant.avatar_url}
                      alt={participant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    participant.name[0]
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {participant.name}
                    </p>
                    {participant.role === 'host' && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-900">
                        Host
                      </span>
                    )}
                  </div>
                  {participant.joined_at && (
                    <p className="text-xs text-slate-500">
                      Joined {new Date(participant.joined_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
