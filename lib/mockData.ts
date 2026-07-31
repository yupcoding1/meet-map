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
  distance: number;
  attendees: number;
  image: string;
}

export const ACTIVITIES: Record<ActivityType, { label: string; color: string }> = {
  coffee: { label: 'Coffee', color: 'bg-amber-100 text-amber-700' },
  hiking: { label: 'Hiking', color: 'bg-green-100 text-green-700' },
  dining: { label: 'Dining', color: 'bg-red-100 text-red-700' },
  shopping: { label: 'Shopping', color: 'bg-pink-100 text-pink-700' },
  cultural: { label: 'Cultural', color: 'bg-purple-100 text-purple-700' },
  sports: { label: 'Sports', color: 'bg-blue-100 text-blue-700' },
};

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
    distance: 0.3,
    attendees: 5,
    image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
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
    distance: 1.2,
    attendees: 8,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    title: 'Italian Dinner Night',
    description: 'Exploring authentic Italian cuisine together',
    location: 'Trattoria da Lucia',
    lat: 40.7505,
    lng: -73.9972,
    activity: 'dining',
    date: '2024-08-17',
    distance: 0.8,
    attendees: 12,
    image: 'https://images.unsplash.com/photo-1504674900769-cd94b3b1c5d4?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    title: 'Vintage Market Explore',
    description: 'Hunting for unique finds and vintage treasures',
    location: 'Brooklyn Vintage Market',
    lat: 40.6782,
    lng: -73.9442,
    activity: 'shopping',
    date: '2024-08-18',
    distance: 2.5,
    attendees: 6,
    image: 'https://images.unsplash.com/photo-1555529220-4a95260d7cec?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    title: 'Museum Exhibition Tour',
    description: 'Guided tour of contemporary art collections',
    location: 'Modern Art Museum',
    lat: 40.7711,
    lng: -73.9776,
    activity: 'cultural',
    date: '2024-08-19',
    distance: 1.5,
    attendees: 10,
    image: 'https://images.unsplash.com/photo-1578321272176-4c4c7c2e1838?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    title: 'Basketball Pickup Game',
    description: 'Casual basketball game, all skill levels welcome',
    location: 'West 4th Street Basketball Court',
    lat: 40.7331,
    lng: -74.0025,
    activity: 'sports',
    date: '2024-08-20',
    distance: 1.8,
    attendees: 4,
    image: 'https://images.unsplash.com/photo-1546519638-68ad109c020b?w=400&h=300&fit=crop',
  },
  {
    id: '7',
    title: 'Sunset Coffee Session',
    description: 'Relaxed evening coffee and chat',
    location: 'Rooftop Coffee Lounge',
    lat: 40.7489,
    lng: -73.9680,
    activity: 'coffee',
    date: '2024-08-21',
    distance: 0.5,
    attendees: 7,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop',
  },
  {
    id: '8',
    title: 'Hudson River Trail',
    description: 'Beautiful trail with river views and fresh air',
    location: 'Hudson River Greenway',
    lat: 40.7577,
    lng: -73.9855,
    activity: 'hiking',
    date: '2024-08-22',
    distance: 0.7,
    attendees: 9,
    image: 'https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?w=400&h=300&fit=crop',
  },
];

export function getNearbyPlans(
  filters?: {
    activity?: ActivityType;
    maxDistance?: number;
    date?: string;
  }
): Plan[] {
  return mockPlans.filter((plan) => {
    if (filters?.activity && plan.activity !== filters.activity) return false;
    if (filters?.maxDistance && plan.distance > filters.maxDistance) return false;
    if (filters?.date && plan.date !== filters.date) return false;
    return true;
  });
}
