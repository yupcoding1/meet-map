'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plan, Participant, ChatMessage, mockParticipants, mockMessages } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import { Send, Users, AlertCircle } from 'lucide-react';
import ParticipantsList from './ParticipantsList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { getChatMessages, sendChatMessage } from '@/lib/actions/chat';

interface GroupChatProps {
  plan: Plan;
  onClose?: () => void;
  userId?: string; // Real authenticated user ID
}

export default function GroupChat({ plan, onClose, userId }: GroupChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentUserId] = useState(userId || '2'); // Real user ID if provided
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());
  const subscriptionRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial messages and setup real-time subscription
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        setConnectionError(null);
        
        // Load initial messages (only if user is authenticated)
        if (userId) {
          const chatMessages = await getChatMessages(plan.id);
          setMessages(chatMessages);
        }
      } catch (error: any) {
        console.error('[v0] Error loading chat messages:', error);
        setConnectionError(error.message || 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    // Setup real-time subscription for new messages
    const setupSubscription = () => {
      try {
        const supabase = supabaseRef.current;
        
        // Only subscribe if Supabase is configured
        if (!supabase?.channel) {
          console.log('[v0] Supabase not configured, skipping subscriptions');
          return;
        }
        
        const channel = supabase.channel(`chat:${plan.id}`, {
          config: {
            broadcast: { self: false }, // Don't receive own broadcasts, we update locally
          },
        });

        // Subscribe to database changes on chat_messages
        const subscription = channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `plan_id=eq.${plan.id}`,
            },
            (payload) => {
              // Avoid duplicate messages (we add them locally when sending)
              setMessages((prev) => {
                if (prev.some(m => m.id === payload.new.id)) {
                  return prev;
                }
                return [...prev, payload.new];
              });
            }
          )
          .subscribe();

        subscriptionRef.current = subscription;
      } catch (error) {
        console.log('[v0] Subscription setup skipped:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [plan.id, userId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const tempId = `temp_${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      plan_id: plan.id,
      sender: participants.find(p => p.id === currentUserId) || mockParticipants[1],
      content,
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    
    // Optimistically add message to UI
    setMessages((prev) => [...prev, tempMessage]);
    
    // Send to database if user is authenticated
    if (userId) {
      try {
        const savedMessage = await sendChatMessage(plan.id, content);
        
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...savedMessage, sender: tempMessage.sender } : msg
          )
        );
      } catch (error: any) {
        console.error('[v0] Failed to send message:', error);
        // Remove the temp message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setConnectionError('Failed to send message. Try again.');
        setTimeout(() => setConnectionError(null), 3000);
      }
    }
  }, [currentUserId, plan.id, participants, userId]);

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

      {/* Connection Error Alert */}
      {connectionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 md:px-6 flex items-center gap-2">
          <AlertCircle size={18} className="text-red-600" />
          <p className="text-sm text-red-600">{connectionError}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 space-y-4">
          {isLoading && (
            <div className="text-center py-8 text-slate-500">
              <p>Loading messages...</p>
            </div>
          )}
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
