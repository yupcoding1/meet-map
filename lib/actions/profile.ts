'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from './auth';

export async function updateUserProfile(updates: {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
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
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function updateUserInterests(interestIds: string[]) {
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

  // Delete existing interests
  await supabase
    .from('user_interest_mappings')
    .delete()
    .eq('user_id', user.id);

  // Insert new interests
  if (interestIds.length > 0) {
    const { error } = await supabase
      .from('user_interest_mappings')
      .insert(
        interestIds.map(interestId => ({
          user_id: user.id,
          interest_id: interestId,
        }))
      );

    if (error) {
      console.error('Error updating interests:', error);
      throw new Error(error.message);
    }
  }

  return { success: true };
}

export async function getUserInterests(userId: string) {
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
    .from('user_interest_mappings')
    .select(`
      interest_id,
      interest_tags:interest_id(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching interests:', error);
    return [];
  }

  return data || [];
}

export async function getAllInterests() {
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
    .from('interest_tags')
    .select('*');

  if (error) {
    console.error('Error fetching interests:', error);
    return [];
  }

  return data || [];
}

export async function getActivityTypes() {
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
    .from('activity_types')
    .select('*');

  if (error) {
    console.error('Error fetching activity types:', error);
    return [];
  }

  return data || [];
}
