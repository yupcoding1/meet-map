'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from './auth';

export async function requestToJoinPlan(planId: string, message?: string) {
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

  const { data, error } = await supabase
    .from('join_requests')
    .insert({
      plan_id: planId,
      user_id: user.id,
      message: message || '',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already requested to join this plan');
    }
    console.error('Error requesting to join plan:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function approveMember(requestId: string) {
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

  // Get join request details
  const { data: joinRequest, error: fetchError } = await supabase
    .from('join_requests')
    .select('plan_id, user_id')
    .eq('id', requestId)
    .single();

  if (fetchError || !joinRequest) {
    throw new Error('Join request not found');
  }

  // Verify user is host of the plan
  const { data: plan } = await supabase
    .from('plans')
    .select('host_id')
    .eq('id', joinRequest.plan_id)
    .single();

  if (plan?.host_id !== user.id) {
    throw new Error('Unauthorized: You are not the host of this plan');
  }

  // Update join request status
  await supabase
    .from('join_requests')
    .update({ status: 'approved', responded_at: new Date().toISOString() })
    .eq('id', requestId);

  // Add user to plan participants
  const { error: addError } = await supabase
    .from('plan_participants')
    .insert({
      plan_id: joinRequest.plan_id,
      user_id: joinRequest.user_id,
      status: 'approved',
    });

  if (addError) {
    console.error('Error adding participant:', addError);
    throw new Error(addError.message);
  }

  return { success: true };
}

export async function declineMember(requestId: string) {
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

  // Get join request details
  const { data: joinRequest, error: fetchError } = await supabase
    .from('join_requests')
    .select('plan_id')
    .eq('id', requestId)
    .single();

  if (fetchError || !joinRequest) {
    throw new Error('Join request not found');
  }

  // Verify user is host of the plan
  const { data: plan } = await supabase
    .from('plans')
    .select('host_id')
    .eq('id', joinRequest.plan_id)
    .single();

  if (plan?.host_id !== user.id) {
    throw new Error('Unauthorized: You are not the host of this plan');
  }

  // Update join request status
  const { error } = await supabase
    .from('join_requests')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    console.error('Error declining request:', error);
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getJoinRequests(planId: string) {
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

  // Verify user is host of the plan
  const { data: plan } = await supabase
    .from('plans')
    .select('host_id')
    .eq('id', planId)
    .single();

  if (plan?.host_id !== user.id) {
    throw new Error('Unauthorized: You are not the host of this plan');
  }

  const { data, error } = await supabase
    .from('join_requests')
    .select(`
      *,
      user_profiles:user_id(id, full_name, avatar_url, bio)
    `)
    .eq('plan_id', planId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }

  return data || [];
}
