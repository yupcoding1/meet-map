'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plan, Participant, ChatMessage, mockParticipants, mockMessages } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import { Send, Users } from 'lucide-react';
import ParticipantsList from './ParticipantsList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

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
  const supabaseRef = useRef(createClient());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup real-time subscription for messages
  useEffect(() => {
    try {
      const supabase = supabaseRef.current;
      
      // Check if Supabase is properly configured
      if (!supabase || !supabase.channel) {
        console.log('[v0] Supabase not configured, using mock mode');
        return;
      }
      
      // Subscribe to new messages for this plan
      const channel = supabase.channel(`chat:${plan.id}`);
      
      if (!channel || !channel.on) {
        return;
      }

      const subscription = channel
        .on(
          'broadcast',
          { event: 'new_message' },
          (payload: { new: ChatMessage }) => {
            setMessages((prev) => {
              // Avoid duplicate messages
              if (prev.some(m => m.id === payload.new.id)) {
                return prev;
              }
              return [...prev, payload.new];
            });
          }
        )
        .on(
          'broadcast',
          { event: 'participant_joined' },
          (payload: { participant: Participant }) => {
            // Add system message
            const systemMessage: ChatMessage = {
              id: `system_${Date.now()}`,
              plan_id: plan.id,
              sender: { id: 'system', name: 'System', avatar_url: '' },
              content: `${payload.participant.name} joined the group`,
              timestamp: new Date().toISOString(),
              type: 'system',
            };
            setMessages((prev) => [...prev, systemMessage]);
            
            // Add participant if not already there
            setParticipants((prev) => {
              if (prev.some(p => p.id === payload.participant.id)) {
                return prev;
              }
              return [...prev, payload.participant];
            });
          }
        )
        .subscribe();

      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.log('[v0] Supabase subscription setup failed:', error);
      return;
    }
  }, [plan.id]);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: `${currentUserId}_${Date.now()}`,
      plan_id: plan.id,
      sender: participants.find(p => p.id === currentUserId) || mockParticipants[1],
      content,
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    
    // Add message immediately to UI
    setMessages((prev) => [...prev, newMessage]);
    
    // Try to broadcast to other clients via Supabase
    try {
      const supabase = supabaseRef.current;
      const channel = supabase?.channel(`chat:${plan.id}`);
      if (channel && channel.send) {
        channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: { new: newMessage },
        });
      }
    } catch (error) {
      console.log('[v0] Failed to send message via Supabase:', error);
      // Message was already added to UI, so continue
    }
  }, [currentUserId, plan.id, participants]);

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
      <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-6 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{plan.title}</h1>
              <div className="flex flex-col gap-1.5 mt-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatDate(plan.date)} at {formatTime(plan.time)}</span>
                </div>
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
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map((participant) => (
                <div
                  key={participant.id}
                  className="w-8 h-8 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-900 overflow-hidden hover:scale-110 transition"
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
              className="gap-2 rounded-lg text-slate-600 hover:text-slate-900"
            >
              <Users size={16} />
              <span className="text-sm font-medium">{participants.length} members</span>
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
