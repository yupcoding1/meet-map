'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from './auth';

export async function getPlansNearUser(latitude: number, longitude: number, radiusKm: number = 5) {
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

  const { data, error } = await supabase.rpc('get_nearby_plans', {
    user_lat: latitude,
    user_lng: longitude,
    radius_km: radiusKm,
  });

  if (error) {
    console.error('Error fetching nearby plans:', error);
    return [];
  }

  return data || [];
}

export async function createPlan(planData: {
  title: string;
  description: string;
  activity_type_id: string;
  venue_name: string;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  max_participants: number;
  difficulty_level: string;
}) {
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
    .from('plans')
    .insert({
      host_id: user.id,
      ...planData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating plan:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function getPlan(planId: string) {
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
    .from('plans')
    .select(`
      *,
      activity_types:activity_type_id(*),
      user_profiles:host_id(id, full_name, avatar_url),
      plan_participants(*)
    `)
    .eq('id', planId)
    .single();

  if (error) {
    console.error('Error fetching plan:', error);
    return null;
  }

  return data;
}

export async function getUserPlans(userId: string) {
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
    .from('plans')
    .select(`
      *,
      activity_types:activity_type_id(*),
      plan_participants(status)
    `)
    .eq('host_id', userId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching user plans:', error);
    return [];
  }

  return data || [];
}

export async function getJoinedPlans(userId: string) {
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
    .from('plan_participants')
    .select(`
      plan_id,
      status,
      plans:plan_id(*, activity_types:activity_type_id(*))
    `)
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Error fetching joined plans:', error);
    return [];
  }

  return data || [];
}
