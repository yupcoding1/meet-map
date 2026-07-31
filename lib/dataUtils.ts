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

// Mock data for fallback
export const mockPlans: Plan[] = [
  {
    id: '1',
    title: 'Morning Coffee Meetup',
    description: 'Starting the day with great coffee and interesting conversations',
    location: 'Brew & Bean Coffee Shop',
    lat: 40.7524,
    lng: -73.9797,
    activity: 'coffee',
    date: '2024-08-15',
    time: '08:00',
    spots_available: 5,
    attendees_count: 5,
    image_url: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    title: 'Central Park Hike',
    description: 'Scenic walk through Central Park, perfect for a peaceful afternoon',
    location: 'Central Park Entrance',
    lat: 40.7829,
    lng: -73.9654,
    activity: 'hiking',
    date: '2024-08-16',
    time: '14:00',
    spots_available: 8,
    attendees_count: 8,
    image_url: 'https://images.unsplash.com/photo-1551632786-de41ec16a83a?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    title: 'Rooftop Dinner Party',
    description: 'Enjoy delicious cuisine while watching the sunset',
    location: 'Skyline Restaurant',
    lat: 40.7489,
    lng: -73.9680,
    activity: 'dining',
    date: '2024-08-17',
    time: '19:00',
    spots_available: 6,
    attendees_count: 3,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    title: 'Weekend Shopping Spree',
    description: 'Hit up the best shops in the city',
    location: 'Fifth Avenue',
    lat: 40.7614,
    lng: -73.9776,
    activity: 'shopping',
    date: '2024-08-18',
    time: '11:00',
    spots_available: 4,
    attendees_count: 2,
    image_url: 'https://images.unsplash.com/photo-1555529394-cc5228052804?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    title: 'Art Gallery Tour',
    description: 'Explore contemporary art with fellow enthusiasts',
    location: 'Modern Art Museum',
    lat: 40.7711,
    lng: -73.9896,
    activity: 'cultural',
    date: '2024-08-19',
    time: '16:00',
    spots_available: 10,
    attendees_count: 4,
    image_url: 'https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    title: 'Basketball Game',
    description: 'Pickup basketball at the local court',
    location: 'Madison Square Park',
    lat: 40.7380,
    lng: -73.9855,
    activity: 'sports',
    date: '2024-08-20',
    time: '17:00',
    spots_available: 6,
    attendees_count: 5,
    image_url: 'https://images.unsplash.com/photo-1546519638-68711109e7e4?w=400&h=300&fit=crop',
  },
  {
    id: '7',
    title: 'Coffee & Code',
    description: 'Developers hangout for coffee and coding',
    location: 'Tech Hub Cafe',
    lat: 40.7505,
    lng: -73.9680,
    activity: 'coffee',
    date: '2024-08-21',
    time: '09:00',
    spots_available: 8,
    attendees_count: 3,
    image_url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=300&fit=crop',
  },
  {
    id: '8',
    title: 'Mountain Trail Adventure',
    description: 'Challenging hike with amazing views',
    location: 'Bear Mountain State Park',
    lat: 41.3186,
    lng: -73.9850,
    activity: 'hiking',
    date: '2024-08-22',
    time: '08:30',
    spots_available: 10,
    attendees_count: 6,
    image_url: 'https://images.unsplash.com/photo-1540959375944-7049f642e9a5?w=400&h=300&fit=crop',
  },
];

export const ACTIVITIES = {
  coffee: { label: 'Coffee', color: 'bg-amber-100 text-amber-800' },
  hiking: { label: 'Hiking', color: 'bg-green-100 text-green-800' },
  dining: { label: 'Dining', color: 'bg-orange-100 text-orange-800' },
  shopping: { label: 'Shopping', color: 'bg-pink-100 text-pink-800' },
  cultural: { label: 'Cultural', color: 'bg-purple-100 text-purple-800' },
  sports: { label: 'Sports', color: 'bg-blue-100 text-blue-800' },
};

// Get plans from Supabase or fallback to mock data
export async function getPlans(): Promise<Plan[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching plans from Supabase:', error);
      return mockPlans;
    }

    return data || mockPlans;
  } catch (error) {
    console.warn('Failed to connect to Supabase, using mock data:', error);
    return mockPlans;
  }
}

// Get nearby plans
export function getNearbyPlans(
  plans: Plan[],
  activity?: ActivityType,
  maxDistance: number = 5
): Plan[] {
  let filtered = plans;

  if (activity) {
    filtered = filtered.filter(p => p.activity === activity);
  }

  // For demo: return all filtered plans (in real app, use geospatial queries)
  // Mock distance calculation would filter, but we'll return all for demo purposes
  // In production, use Supabase PostGIS for real distance filtering
  return filtered;
}

// Create a new plan in Supabase
export async function createPlan(plan: Omit<Plan, 'id'>): Promise<Plan | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plans')
      .insert([plan])
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to create plan:', error);
    return null;
  }
}

// Get a single plan by ID
export async function getPlanById(id: string): Promise<Plan | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Error fetching plan:', error);
      return mockPlans.find(p => p.id === id) || null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to fetch plan:', error);
    return mockPlans.find(p => p.id === id) || null;
  }
}

// Request to join a plan
export async function requestToJoinPlan(planId: string, userId: string): Promise<JoinRequest | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('join_requests')
      .insert([{ plan_id: planId, user_id: userId, status: 'pending' }])
      .select()
      .single();

    if (error) {
      console.error('Error requesting to join:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to request join:', error);
    return null;
  }
}

// Approve a join request (for plan host only)
export async function approveJoinRequest(requestId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Failed to approve join:', error);
    return false;
  }
}

// Decline a join request (for plan host only)
export async function declineJoinRequest(requestId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    return !error;
  } catch (error) {
    console.error('Failed to decline join:', error);
    return false;
  }
}

// Mock participants
export const mockParticipants: Participant[] = [
  { id: '1', name: 'Sarah', avatar_url: 'https://i.pravatar.cc/150?img=1', role: 'host' },
  { id: '2', name: 'Alex', avatar_url: 'https://i.pravatar.cc/150?img=2', role: 'member' },
  { id: '3', name: 'Jordan', avatar_url: 'https://i.pravatar.cc/150?img=3', role: 'member' },
  { id: '4', name: 'Casey', avatar_url: 'https://i.pravatar.cc/150?img=4', role: 'member' },
  { id: '5', name: 'Morgan', avatar_url: 'https://i.pravatar.cc/150?img=5', role: 'member' },
];

// Mock messages
export const mockMessages: ChatMessage[] = [
  {
    id: '1',
    plan_id: '1',
    sender: mockParticipants[0],
    content: 'Hey everyone! Looking forward to seeing you all tomorrow morning.',
    timestamp: '2024-08-14T18:30:00Z',
    type: 'message',
  },
  {
    id: '2',
    plan_id: '1',
    sender: mockParticipants[1],
    content: 'Count me in! Should I get there early to grab a table?',
    timestamp: '2024-08-14T18:35:00Z',
    type: 'message',
  },
  {
    id: '3',
    plan_id: '1',
    sender: mockParticipants[0],
    content: 'I\'ll be there by 8am sharp. The coffee there is amazing!',
    timestamp: '2024-08-14T18:40:00Z',
    type: 'message',
  },
  {
    id: '4',
    plan_id: '1',
    sender: mockParticipants[2],
    content: 'Excited to join! This is my first meetup with this group.',
    timestamp: '2024-08-14T19:00:00Z',
    type: 'message',
  },
  {
    id: '5',
    plan_id: '1',
    sender: { id: 'system', name: 'System', avatar_url: '' },
    content: 'Morgan joined the group',
    timestamp: '2024-08-14T19:05:00Z',
    type: 'system',
  },
  {
    id: '6',
    plan_id: '1',
    sender: mockParticipants[3],
    content: 'Oh nice! See you all there. I\'ll bring some pastries!',
    timestamp: '2024-08-14T19:10:00Z',
    type: 'message',
  },
];

// Get mock messages for a plan
export function getMessagesForPlan(planId: string): ChatMessage[] {
  return mockMessages.filter(m => m.plan_id === planId);
}

// Get participants for a plan
export function getParticipantsForPlan(planId: string): Participant[] {
  return mockParticipants;
}
