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
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.sender.id === currentUserId}
        />
      ))}
    </div>
  );
}
