'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from './auth';

export async function getChatMessages(planId: string, limit: number = 50) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // Verify user is part of the plan
  const { data: planParticipant } = await supabase
    .from('plan_participants')
    .select('*')
    .eq('plan_id', planId)
    .eq('user_id', user.id)
    .single();

  const { data: plan } = await supabase
    .from('plans')
    .select('host_id')
    .eq('id', planId)
    .single();

  if (!planParticipant && plan?.host_id !== user.id) {
    throw new Error('Unauthorized: You are not part of this plan');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      user_profiles:sender_id(id, full_name, avatar_url)
    `)
    .eq('plan_id', planId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return data || [];
}

export async function sendChatMessage(planId: string, content: string) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // Verify user is part of the plan
  const { data: planParticipant } = await supabase
    .from('plan_participants')
    .select('*')
    .eq('plan_id', planId)
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single();

  const { data: plan } = await supabase
    .from('plans')
    .select('host_id')
    .eq('id', planId)
    .single();

  if (!planParticipant && plan?.host_id !== user.id) {
    throw new Error('Unauthorized: You are not part of this plan');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      plan_id: planId,
      sender_id: user.id,
      content: content.trim(),
      message_type: 'message',
    })
    .select(`
      *,
      user_profiles:sender_id(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error sending chat message:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function sendSystemMessage(planId: string, content: string) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      plan_id: planId,
      sender_id: null,
      content,
      message_type: 'system',
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending system message:', error);
    throw new Error(error.message);
  }

  return data;
}
