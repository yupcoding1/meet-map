import { createClient } from '@/lib/supabase/client';

export type ActivityType = 'coffee' | 'hiking' | 'dining' | 'shopping' | 'cultural' | 'sports';

export interface Plan {
  id: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  activity: ActivityType;
  date: string;
  time: string;
  spots_available: number;
  attendees_count: number;
  image_url?: string;
}

export interface User {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'approved' | 'declined';
  user: User;
  created_at?: string;
}

export interface PlanWithHost extends Plan {
  host: User;
  join_requests?: JoinRequest[];
}

export interface ChatMessage {
  id: string;
  plan_id: string;
  sender: User;
  content: string;
  timestamp: string;
  type: 'message' | 'system';
}

export interface Participant extends User {
  joined_at?: string;
  role?: 'host' | 'member';
}

export const ACTIVITIES: Record<string, { label: string; color: string }> = {
  coffee: { label: 'Coffee', color: 'bg-amber-100 text-amber-800' },
  hiking: { label: 'Hiking', color: 'bg-green-100 text-green-800' },
  dining: { label: 'Dining', color: 'bg-orange-100 text-orange-800' },
  shopping: { label: 'Shopping', color: 'bg-pink-100 text-pink-800' },
  cultural: { label: 'Cultural', color: 'bg-purple-100 text-purple-800' },
  sports: { label: 'Sports', color: 'bg-blue-100 text-blue-800' },
};

// Get plans from Supabase (no mock data fallback)
export async function getPlans(): Promise<Plan[]> {
  console.log('[dataUtils] getPlans() called - fetching from Supabase...');
  try {
    const supabase = createClient();
    console.log('[dataUtils] Supabase client created, querying plans table...');
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[dataUtils] Supabase error fetching plans:', error.message);
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log(`[dataUtils] Successfully fetched ${data?.length || 0} plans from Supabase`);
    
    // Map Supabase schema to Plan interface
    const mappedPlans: Plan[] = (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      location: item.venue_name || '',
      lat: item.latitude || 0,
      lng: item.longitude || 0,
      activity: 'coffee', // Default, would need activity_type mapping
      date: item.start_time ? new Date(item.start_time).toISOString().split('T')[0] : '',
      time: item.start_time ? new Date(item.start_time).toTimeString().slice(0, 5) : '',
      spots_available: item.max_participants || 0,
      attendees_count: item.current_participants || 0,
      image_url: undefined,
    }));
    
    return mappedPlans;
  } catch (error) {
    console.error('[dataUtils] Failed to fetch plans from Supabase:', error);
    throw error;
  }
}

// Get nearby plans (filtering by activity)
export function getNearbyPlans(
  plans: Plan[],
  activity?: ActivityType,
  maxDistance: number = 5
): Plan[] {
  console.log(`[dataUtils] getNearbyPlans() called - activity: ${activity || 'all'}, maxDistance: ${maxDistance}km`);
  let filtered = plans;

  if (activity) {
    filtered = filtered.filter(p => p.activity === activity);
    console.log(`[dataUtils] Filtered by activity '${activity}': ${filtered.length} plans remaining`);
  }

  return filtered;
}

// Create a new plan in Supabase
export async function createPlan(plan: Omit<Plan, 'id'>): Promise<Plan | null> {
  console.log('[dataUtils] createPlan() called:', plan);
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[dataUtils] Current user:', user?.id || 'not authenticated');
    
    if (!user) {
      console.error('[dataUtils] Cannot create plan: user not authenticated');
      return null;
    }
    
    // Map Plan interface to Supabase schema
    // Note: activity_type_id is nullable - we'll try to find a matching activity type
    const dbPlan: any = {
      host_id: user.id,
      title: plan.title,
      description: plan.description,
      venue_name: plan.location,
      latitude: plan.lat,
      longitude: plan.lng,
      start_time: `${plan.date}T${plan.time}:00`,
      end_time: `${plan.date}T${plan.time}:00`,
      max_participants: plan.spots_available,
      current_participants: 1,
      is_public: true,
      status: 'active',
    };

    // Try to find matching activity_type_id
    try {
      const activityName = plan.activity.charAt(0).toUpperCase() + plan.activity.slice(1);
      const { data: activityType } = await supabase
        .from('activity_types')
        .select('id')
        .ilike('name', activityName)
        .single();
      
      if (activityType) {
        dbPlan.activity_type_id = activityType.id;
      } else {
        // Use the first activity type as default
        const { data: defaultType } = await supabase
          .from('activity_types')
          .select('id')
          .limit(1)
          .single();
        if (defaultType) {
          dbPlan.activity_type_id = defaultType.id;
        }
      }
    } catch (e) {
      console.warn('[dataUtils] Could not find activity_type_id, trying without it');
    }
    
    console.log('[dataUtils] Inserting plan into Supabase:', dbPlan);
    
    const { data, error } = await supabase
      .from('plans')
      .insert([dbPlan])
      .select()
      .single();

    if (error) {
      console.error('[dataUtils] Error creating plan:', error.message);
      return null;
    }

    console.log('[dataUtils] Plan created successfully:', data);
    return {
      ...plan,
      id: data.id,
    };
  } catch (error) {
    console.error('[dataUtils] Failed to create plan:', error);
    return null;
  }
}

// Get a single plan by ID
export async function getPlanById(id: string): Promise<Plan | null> {
  console.log(`[dataUtils] getPlanById() called - id: ${id}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[dataUtils] Error fetching plan:', error.message);
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log('[dataUtils] Plan fetched:', data?.id);
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      location: data.venue_name || '',
      lat: data.latitude || 0,
      lng: data.longitude || 0,
      activity: 'coffee',
      date: data.start_time ? new Date(data.start_time).toISOString().split('T')[0] : '',
      time: data.start_time ? new Date(data.start_time).toTimeString().slice(0, 5) : '',
      spots_available: data.max_participants || 0,
      attendees_count: data.current_participants || 0,
      image_url: undefined,
    };
  } catch (error) {
    console.error('[dataUtils] Failed to fetch plan:', error);
    throw error;
  }
}

// Request to join a plan
export async function requestToJoinPlan(planId: string, userId: string): Promise<JoinRequest | null> {
  console.log(`[dataUtils] requestToJoinPlan() called - planId: ${planId}, userId: ${userId}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('join_requests')
      .insert([{ plan_id: planId, user_id: userId, status: 'pending' }])
      .select()
      .single();

    if (error) {
      console.error('[dataUtils] Error requesting to join:', error.message);
      return null;
    }

    console.log('[dataUtils] Join request created:', data?.id);
    return data;
  } catch (error) {
    console.error('[dataUtils] Failed to request join:', error);
    return null;
  }
}

// Approve a join request (for plan host only)
export async function approveJoinRequest(requestId: string, userId: string): Promise<boolean> {
  console.log(`[dataUtils] approveJoinRequest() called - requestId: ${requestId}, userId: ${userId}`);
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .eq('user_id', userId);

    const success = !error;
    console.log(`[dataUtils] Join request approved: ${success}`);
    return success;
  } catch (error) {
    console.error('[dataUtils] Failed to approve join:', error);
    return false;
  }
}

// Decline a join request (for plan host only)
export async function declineJoinRequest(requestId: string): Promise<boolean> {
  console.log(`[dataUtils] declineJoinRequest() called - requestId: ${requestId}`);
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    const success = !error;
    console.log(`[dataUtils] Join request declined: ${success}`);
    return success;
  } catch (error) {
    console.error('[dataUtils] Failed to decline join:', error);
    return false;
  }
}

// Get messages for a plan from Supabase
export async function getMessagesForPlan(planId: string): Promise<ChatMessage[]> {
  console.log(`[dataUtils] getMessagesForPlan() called - planId: ${planId}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[dataUtils] Error fetching messages:', error.message);
      return [];
    }

    console.log(`[dataUtils] Fetched ${data?.length || 0} messages`);
    return data || [];
  } catch (error) {
    console.error('[dataUtils] Failed to fetch messages:', error);
    return [];
  }
}

// Get participants for a plan from Supabase
export async function getParticipantsForPlan(planId: string): Promise<Participant[]> {
  console.log(`[dataUtils] getParticipantsForPlan() called - planId: ${planId}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plan_participants')
      .select('*')
      .eq('plan_id', planId);

    if (error) {
      console.error('[dataUtils] Error fetching participants:', error.message);
      return [];
    }

    console.log(`[dataUtils] Fetched ${data?.length || 0} participants`);
    return data || [];
  } catch (error) {
    console.error('[dataUtils] Failed to fetch participants:', error);
    return [];
  }
}