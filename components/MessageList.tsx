'use client';

import { ChatMessage } from '@/lib/dataUtils';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export default function MessageList({
  messages,
  currentUserId,
}: MessageListProps) {
  // Group messages by date for visual clarity
  const getMessageDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const groupedMessages = messages.reduce(
    (acc, message) => {
      const date = getMessageDate(message.timestamp);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(message);
      return acc;
    },
    {} as Record<string, ChatMessage[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date separator */}
          {date !== getMessageDate(new Date().toISOString()) && (
            <div className="flex justify-center py-3">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
          )}
          
          {/* Messages for this date */}
          <div className="space-y-4">
            {dateMessages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.sender.id === currentUserId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
