'use client';

import { ChatMessage } from '@/lib/dataUtils';
import { formatDistanceToNow } from 'date-fns';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function MessageItem({ message, isOwn }: MessageItemProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-3">
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 text-xs font-medium px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold overflow-hidden ${
          isOwn ? 'bg-teal-100 text-teal-900' : 'bg-slate-200 text-slate-900'
        }`}
      >
        {message.sender.avatar_url ? (
          <img
            src={message.sender.avatar_url}
            alt={message.sender.name}
            className="w-full h-full object-cover"
          />
        ) : (
          message.sender.name[0]
        )}
      </div>

      {/* Message Bubble */}
      <div className={`flex flex-col gap-1 max-w-xs ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex gap-2 items-baseline">
          {!isOwn && (
            <p className="text-sm font-semibold text-slate-900">
              {message.sender.name}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
        <div
          className={`px-4 py-2.5 rounded-2xl max-w-xs break-words ${
            isOwn
              ? 'bg-teal-500 text-white rounded-br-md'
              : 'bg-slate-200 text-slate-900 rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
