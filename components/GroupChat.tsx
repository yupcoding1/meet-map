'use client';

import { useState, useRef, useEffect } from 'react';
import { Plan, Participant, ChatMessage, mockParticipants, mockMessages } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import { Send, Users } from 'lucide-react';
import ParticipantsList from './ParticipantsList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { formatDistanceToNow } from 'date-fns';

interface GroupChatProps {
  plan: Plan;
  onClose?: () => void;
}

export default function GroupChat({ plan, onClose }: GroupChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentUserId] = useState('2'); // Mock current user (Alex)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: String(messages.length + 1),
      plan_id: plan.id,
      sender: participants.find(p => p.id === currentUserId) || mockParticipants[1],
      content,
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    setMessages([...messages, newMessage]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2024-08-15T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
              <div className="flex flex-col gap-1 mt-2 text-sm text-slate-600">
                <p>{plan.location}</p>
                <p>
                  {formatDate(plan.date)} at {formatTime(plan.time)}
                </p>
              </div>
            </div>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-lg"
              >
                Back
              </Button>
            )}
          </div>

          {/* Participants Row */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map((participant) => (
                <div
                  key={participant.id}
                  className="w-8 h-8 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-900 overflow-hidden"
                  title={participant.name}
                >
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
              ))}
              {participants.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-xs font-semibold text-slate-900">
                  +{participants.length - 4}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParticipants(true)}
              className="gap-2 rounded-lg"
            >
              <Users size={16} />
              <span className="text-sm">{participants.length} members</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 space-y-4">
          <MessageList messages={messages} currentUserId={currentUserId} />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />

      {/* Participants Modal */}
      {showParticipants && (
        <ParticipantsList
          participants={participants}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </div>
  );
}
