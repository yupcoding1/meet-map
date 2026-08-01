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
  host_id?: string;
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

// Helper: Map a Supabase plan row to the Plan interface
function mapPlan(item: any): Plan {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    location: item.venue_name || '',
    lat: item.latitude || 0,
    lng: item.longitude || 0,
    activity: 'coffee',
    date: item.start_time ? new Date(item.start_time).toISOString().split('T')[0] : '',
    time: item.start_time ? new Date(item.start_time).toTimeString().slice(0, 5) : '',
    spots_available: item.max_participants || 0,
    attendees_count: item.current_participants || 0,
    image_url: undefined,
    host_id: item.host_id,
  };
}

// Get all plans from Supabase
export async function getPlans(): Promise<Plan[]> {
  console.log('[dataUtils] getPlans() called');
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Supabase error: ${error.message}`);
    const plans = (data || []).map(mapPlan);
    console.log(`[dataUtils] Fetched ${plans.length} plans`);
    return plans;
  } catch (error) {
    console.error('[dataUtils] Failed to fetch plans:', error);
    throw error;
  }
}

// Filter plans by activity
export function getNearbyPlans(plans: Plan[], activity?: ActivityType, maxDistance: number = 5): Plan[] {
  if (!activity) return plans;
  return plans.filter(p => p.activity === activity);
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

// Delete a plan and all related data (cascades via DB foreign keys)
export async function deletePlan(planId: string): Promise<boolean> {
  console.log(`[dataUtils] deletePlan() - planId: ${planId}`);
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('[dataUtils] Error deleting plan:', error.message);
      return false;
    }
    console.log('[dataUtils] Plan deleted successfully');
    return true;
  } catch (error) {
    console.error('[dataUtils] Failed to delete plan:', error);
    return false;
  }
}

// Update an existing plan in Supabase
export async function updatePlan(planId: string, updates: Partial<Omit<Plan, 'id'>>): Promise<Plan | null> {
  console.log(`[dataUtils] updatePlan() - planId: ${planId}`);
  try {
    const supabase = createClient();
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.location) dbUpdates.venue_name = updates.location;
    if (updates.lat) dbUpdates.latitude = updates.lat;
    if (updates.lng) dbUpdates.longitude = updates.lng;
    if (updates.date && updates.time) {
      dbUpdates.start_time = `${updates.date}T${updates.time}:00`;
      dbUpdates.end_time = `${updates.date}T${updates.time}:00`;
    }
    if (updates.spots_available) dbUpdates.max_participants = updates.spots_available;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('plans')
      .update(dbUpdates)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('[dataUtils] Error updating plan:', error.message);
      return null;
    }
    console.log('[dataUtils] Plan updated:', data.id);
    return mapPlan(data);
  } catch (error) {
    console.error('[dataUtils] Failed to update plan:', error);
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
    return mapPlan(data);
  } catch (error) {
    console.error('[dataUtils] Failed to fetch plan:', error);
    throw error;
  }
}

// Request to join a plan
export async function requestToJoinPlan(planId: string, userId: string): Promise<JoinRequest | null> {
  console.log(`[dataUtils] requestToJoinPlan() - planId: ${planId}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('join_requests')
      .insert([{ plan_id: planId, user_id: userId, status: 'pending' }])
      .select()
      .single();

    if (error) {
      // Duplicate key = already requested, return existing request as success
      if (error.code === '23505') {
        console.log('[dataUtils] Already requested to join this plan');
        return { id: 'existing', user_id: userId, plan_id: planId, status: 'pending', user: { id: userId, name: '' } };
      }
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
  console.log(`[dataUtils] approveJoinRequest() - requestId: ${requestId}`);
  try {
    const supabase = createClient();

    // Get the join request details (plan_id, user_id)
    const { data: joinRequest, error: fetchError } = await supabase
      .from('join_requests')
      .select('plan_id, user_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !joinRequest) {
      console.error('[dataUtils] Join request not found:', fetchError?.message);
      return false;
    }

    // 1. Update join request status to approved
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      console.error('[dataUtils] Error updating join request:', updateError.message);
      return false;
    }

    // 2. Add user to plan_participants as approved
    const { error: participantError } = await supabase
      .from('plan_participants')
      .insert({
        plan_id: joinRequest.plan_id,
        user_id: joinRequest.user_id,
        status: 'approved',
      });

    if (participantError) {
      console.error('[dataUtils] Error adding participant:', participantError.message);
      return false;
    }

    // 3. current_participants is auto-incremented by the database trigger
    console.log(`[dataUtils] Join request ${requestId} approved successfully`);
    return true;
  } catch (error) {
    console.error('[dataUtils] Failed to approve join:', error);
    return false;
  }
}

// Decline a join request (for plan host only)
export async function declineJoinRequest(requestId: string): Promise<boolean> {
  console.log(`[dataUtils] declineJoinRequest() - requestId: ${requestId}`);
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('[dataUtils] Error declining request:', error.message);
      return false;
    }
    console.log('[dataUtils] Join request declined');
    return true;
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

// Get plans hosted by a specific user
export async function getHostedPlans(userId: string): Promise<Plan[]> {
  console.log(`[dataUtils] getHostedPlans() called - userId: ${userId}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('host_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[dataUtils] Error fetching hosted plans:', error.message);
      return [];
    }

    const plans = (data || []).map(mapPlan);
    console.log(`[dataUtils] Fetched ${plans.length} hosted plans`);
    return plans;
  } catch (error) {
    console.error('[dataUtils] Failed to fetch hosted plans:', error);
    return [];
  }
}

// Get plans the user has joined (approved participants)
export async function getJoinedPlans(userId: string): Promise<Plan[]> {
  console.log(`[dataUtils] getJoinedPlans() called - userId: ${userId}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plan_participants')
      .select('plan_id, plans(*)')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (error) {
      console.error('[dataUtils] Error fetching joined plans:', error.message);
      return [];
    }

    const plans = (data || []).map((item: any) => mapPlan(item.plans));
    console.log(`[dataUtils] Fetched ${plans.length} joined plans`);
    return plans;
  } catch (error) {
    console.error('[dataUtils] Failed to fetch joined plans:', error);
    return [];
  }
}

// Get pending join requests sent by the user
export async function getMyJoinRequests(userId: string): Promise<{ plan: Plan; request: any }[]> {
  console.log(`[dataUtils] getMyJoinRequests() called - userId: ${userId}`);
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('join_requests')
      .select('id, status, created_at, plan_id, plans(*)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[dataUtils] Error fetching my join requests:', error.message);
      return [];
    }

    const results = (data || []).map((item: any) => ({
      request: { id: item.id, status: item.status, created_at: item.created_at, plan_id: item.plan_id },
      plan: mapPlan(item.plans),
    }));

    console.log(`[dataUtils] Fetched ${results.length} pending join requests`);
    return results;
  } catch (error) {
    console.error('[dataUtils] Failed to fetch my join requests:', error);
    return [];
  }
}

// Get incoming join requests for plans hosted by the user
export async function getIncomingJoinRequests(userId: string): Promise<{ plan: Plan; request: any; requester: any }[]> {
  console.log(`[dataUtils] getIncomingJoinRequests() called - userId: ${userId}`);
  try {
    const supabase = createClient();
    
    // First get all plans hosted by the user
    const { data: hostedPlans, error: plansError } = await supabase
      .from('plans')
      .select('id, title, venue_name, latitude, longitude, start_time, max_participants, current_participants, host_id')
      .eq('host_id', userId);

    if (plansError || !hostedPlans || hostedPlans.length === 0) {
      console.log('[dataUtils] No hosted plans found');
      return [];
    }

    const planIds = hostedPlans.map((p: any) => p.id);
    
    // Get pending join requests for those plans
    const { data: requests, error: reqError } = await supabase
      .from('join_requests')
      .select('id, status, created_at, plan_id, user_id, user_profiles!join_requests_user_id_fkey(id, email, full_name, avatar_url)')
      .in('plan_id', planIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (reqError) {
      console.error('[dataUtils] Error fetching incoming requests:', reqError.message);
      return [];
    }

    const results = (requests || []).map((req: any) => {
      const planData = hostedPlans.find((p: any) => p.id === req.plan_id)!;
      const requester = req.user_profiles;
      return {
        request: { id: req.id, status: req.status, created_at: req.created_at, plan_id: req.plan_id, user_id: req.user_id },
        requester: { id: requester?.id, name: requester?.full_name || requester?.email?.split('@')[0] || 'User', avatar_url: requester?.avatar_url },
        plan: mapPlan(planData),
      };
    });

    console.log(`[dataUtils] Fetched ${results.length} incoming join requests`);
    return results;
  } catch (error) {
    console.error('[dataUtils] Failed to fetch incoming join requests:', error);
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