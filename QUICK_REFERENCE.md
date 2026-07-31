# MeetMap - Quick Reference Guide

Copy-paste ready code snippets for common tasks.

---

## 🔐 Authentication

### Check if user is logged in

```typescript
import { getAuthenticatedUser } from '@/lib/actions/auth';

const user = await getAuthenticatedUser();
if (!user) {
  // Not logged in, redirect to login
  redirect('/auth/login');
}
```

### Get current user's profile

```typescript
import { getCurrentUserProfile } from '@/lib/actions/auth';

const profile = await getCurrentUserProfile();
// { id, email, full_name, bio, avatar_url, latitude, longitude, ... }
```

### Get any user's profile (public)

```typescript
import { getUserProfile } from '@/lib/actions/auth';

const profile = await getUserProfile('user-id');
```

---

## 📍 Plans

### Find plans near user

```typescript
import { getPlansNearUser } from '@/lib/actions/plans';

const plans = await getPlansNearUser(
  40.7128,  // user latitude
  -74.0060, // user longitude
  5         // radius in km
);

// Returns:
// [{
//   plan_id, title, venue_name, latitude, longitude,
//   distance_km, start_time, activity_type, host_name,
//   current_participants, max_participants
// }, ...]
```

### Create a new plan

```typescript
import { createPlan } from '@/lib/actions/plans';

const newPlan = await createPlan({
  title: 'Morning Coffee',
  description: 'Coffee and conversation at the cafe',
  activity_type_id: 'activity-uuid', // From getActivityTypes()
  venue_name: 'Central Brew Cafe',
  latitude: 40.7128,
  longitude: -74.0060,
  start_time: '2024-02-15T09:00:00Z',
  end_time: '2024-02-15T11:00:00Z',
  max_participants: 10,
  difficulty_level: 'easy', // 'easy' | 'moderate' | 'hard'
});
```

### Get a specific plan

```typescript
import { getPlan } from '@/lib/actions/plans';

const plan = await getPlan('plan-id');
// Full plan with relationships, participants, activity type, host info
```

### Get my created plans

```typescript
import { getUserPlans } from '@/lib/actions/plans';

const user = await getAuthenticatedUser();
const myPlans = await getUserPlans(user.id);
```

### Get plans I joined

```typescript
import { getJoinedPlans } from '@/lib/actions/plans';

const user = await getAuthenticatedUser();
const joinedPlans = await getJoinedPlans(user.id);
```

---

## 👤 Profile

### Update my profile

```typescript
import { updateUserProfile } from '@/lib/actions/profile';

await updateUserProfile({
  full_name: 'New Name',
  bio: 'Updated bio',
  avatar_url: 'https://...',
  latitude: 40.7580,
  longitude: -73.9855,
  location_name: 'Manhattan, NYC',
});
```

### Update my interests

```typescript
import { updateUserInterests } from '@/lib/actions/profile';

// Get interest IDs first
const interests = await getAllInterests();
// interests = [{id: 'uuid1', name: 'gaming'}, {id: 'uuid2', name: 'hiking'}, ...]

// Update with selected interest IDs
await updateUserInterests([
  interests[0].id,  // gaming
  interests[2].id,  // hiking
]);
```

### Get my interests

```typescript
import { getUserInterests } from '@/lib/actions/profile';

const user = await getAuthenticatedUser();
const interests = await getUserInterests(user.id);
// [{interest_id, interest_tags: {id, name, color_hex}}, ...]
```

### Get all available interests

```typescript
import { getAllInterests } from '@/lib/actions/profile';

const interests = await getAllInterests();
// [{id: 'uuid', name: 'gaming', color_hex: '#FF1493'}, ...]
```

### Get all activity types

```typescript
import { getActivityTypes } from '@/lib/actions/profile';

const types = await getActivityTypes();
// [{id, name, description, icon_emoji, color_hex}, ...]
```

---

## 🤝 Join Requests

### Request to join a plan

```typescript
import { requestToJoinPlan } from '@/lib/actions/joins';

await requestToJoinPlan(
  'plan-id',
  'I love hiking!' // optional message
);
```

### Get pending join requests (host only)

```typescript
import { getJoinRequests } from '@/lib/actions/joins';

const user = await getAuthenticatedUser();
const plan = await getPlan('plan-id');

// Verify you're the host
if (plan.host_id !== user.id) {
  throw new Error('Not the host');
}

const requests = await getJoinRequests('plan-id');
// [{id, user_id, message, user_profiles: {id, full_name, avatar_url, bio}}, ...]
```

### Approve a join request (host only)

```typescript
import { approveMember } from '@/lib/actions/joins';

await approveMember('join-request-id');
// User is now in plan_participants with 'approved' status
```

### Decline a join request (host only)

```typescript
import { declineMember } from '@/lib/actions/joins';

await declineMember('join-request-id');
// User is not added to plan
```

---

## 💬 Chat

### Get chat messages

```typescript
import { getChatMessages } from '@/lib/actions/chat';

const messages = await getChatMessages('plan-id', 50); // Last 50 messages
// [{
//   id, plan_id, sender_id, content, message_type,
//   created_at, user_profiles: {id, full_name, avatar_url}
// }, ...]
```

### Send a chat message

```typescript
import { sendChatMessage } from '@/lib/actions/chat';

const message = await sendChatMessage('plan-id', 'See you soon!');
```

### Subscribe to real-time chat (client component)

```typescript
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ChatSubscription({ planId }) {
  useEffect(() => {
    const supabase = createClient();
    
    const subscription = supabase
      .channel(`chat:${planId}`)
      .on(
        'broadcast',
        { event: 'new_message' },
        (payload) => {
          console.log('New message:', payload.new);
          // Update your UI state here
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [planId]);
}
```

---

## 🗺️ Geolocation & Maps

### Get user's device location

```typescript
import { getCurrentLocation } from '@/lib/map-utils';

try {
  const location = await getCurrentLocation();
  console.log(`Lat: ${location.latitude}, Lng: ${location.longitude}`);
} catch (error) {
  console.error('Location error:', error.message);
}
```

### Calculate distance between two points

```typescript
import { calculateDistance } from '@/lib/map-utils';

const distance = calculateDistance(
  40.7128, -74.0060, // User location
  40.7580, -73.9855  // Plan location
);
console.log(`Distance: ${distance}km`);
```

### Format distance for display

```typescript
import { formatDistance } from '@/lib/map-utils';

const display = formatDistance(2.5);  // "2.5km"
const display2 = formatDistance(0.3); // "300m"
```

### Estimate travel time

```typescript
import { estimateTravelTime } from '@/lib/map-utils';

const time1 = estimateTravelTime(5, 'walking');  // "1h"
const time2 = estimateTravelTime(5, 'driving');  // "8m"
const time3 = estimateTravelTime(5, 'cycling');  // "20m"
```

### Filter plans by radius

```typescript
import { filterPlansByRadius } from '@/lib/map-utils';

const nearbyPlans = filterPlansByRadius(
  allPlans,
  40.7128, -74.0060, // User location
  5 // 5km radius
);
```

### Sort plans by distance

```typescript
import { sortPlansByDistance } from '@/lib/map-utils';

const sorted = sortPlansByDistance(
  allPlans,
  40.7128, -74.0060 // User location
);
// Closest plans first
```

### Get map bounds for multiple plans

```typescript
import { getBounds } from '@/lib/map-utils';

const bounds = getBounds([
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 40.7580, longitude: -73.9855 },
  { latitude: 40.6892, longitude: -74.0445 },
]);

// bounds = {
//   northeast: { lat: 40.7580, lng: -73.9855 },
//   southwest: { lat: 40.6892, lng: -74.0445 }
// }
```

### Save location to device storage

```typescript
import { saveUserLocation } from '@/lib/map-utils';

const location = await getCurrentLocation();
saveUserLocation(location);
// Saved to localStorage for next time
```

### Get saved location from device

```typescript
import { getSavedUserLocation } from '@/lib/map-utils';

const saved = getSavedUserLocation();
if (saved) {
  console.log(`Last known location: ${saved.latitude}, ${saved.longitude}`);
}
```

---

## 🎯 Complete Example: Discover Page

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getPlansNearUser } from '@/lib/actions/plans';
import { getCurrentLocation } from '@/lib/map-utils';
import { formatDistance } from '@/lib/map-utils';

export default function DiscoverPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPlans() {
      try {
        // 1. Get user location
        const location = await getCurrentLocation();
        
        // 2. Fetch nearby plans
        const nearbyPlans = await getPlansNearUser(
          location.latitude,
          location.longitude,
          5 // 5km radius
        );
        
        setPlans(nearbyPlans);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  if (loading) return <div>Loading plans...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid gap-4">
      {plans.map((plan) => (
        <div key={plan.plan_id} className="border rounded-lg p-4">
          <h3>{plan.title}</h3>
          <p>{plan.venue_name}</p>
          <p className="text-sm text-gray-600">
            {formatDistance(plan.distance_km)} away
          </p>
          <p>{plan.activity_type}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Complete Example: Profile Update

```typescript
'use client';

import { useState } from 'react';
import { updateUserProfile, updateUserInterests, getAllInterests } from '@/lib/actions/profile';

export default function ProfileEditor() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interests, setInterests] = useState([]);

  // Load interests on mount
  useEffect(() => {
    async function loadInterests() {
      const data = await getAllInterests();
      setInterests(data);
    }
    loadInterests();
  }, []);

  async function handleSave() {
    // 1. Update profile
    await updateUserProfile({
      full_name: name,
      bio: bio,
    });

    // 2. Update interests
    await updateUserInterests(selectedInterests);

    alert('Profile saved!');
  }

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Your bio"
      />
      
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <button
            key={interest.id}
            onClick={() => {
              if (selectedInterests.includes(interest.id)) {
                setSelectedInterests(selectedInterests.filter(id => id !== interest.id));
              } else {
                setSelectedInterests([...selectedInterests, interest.id]);
              }
            }}
            className={selectedInterests.includes(interest.id) ? 'bg-teal-500' : 'bg-gray-300'}
          >
            {interest.name}
          </button>
        ))}
      </div>

      <button onClick={handleSave}>Save Profile</button>
    </div>
  );
}
```

---

## 📊 Common Database Queries

Run these directly in Supabase SQL Editor:

### Get all plans

```sql
SELECT * FROM plans WHERE status = 'active';
```

### Get plans within 5km of a location

```sql
SELECT * FROM get_nearby_plans(40.7128, -74.0060, 5);
```

### Get all users and their plan counts

```sql
SELECT id, full_name, plans_hosted, plans_joined FROM user_profiles;
```

### Get all active participants in a plan

```sql
SELECT up.id, up.full_name, up.avatar_url
FROM plan_participants pp
JOIN user_profiles up ON pp.user_id = up.id
WHERE pp.plan_id = 'plan-id' AND pp.status = 'approved';
```

### Get recent chat messages

```sql
SELECT * FROM chat_messages
WHERE plan_id = 'plan-id'
ORDER BY created_at DESC
LIMIT 50;
```

### Get pending join requests

```sql
SELECT jr.id, jr.message, up.full_name, up.avatar_url
FROM join_requests jr
JOIN user_profiles up ON jr.user_id = up.id
WHERE jr.plan_id = 'plan-id' AND jr.status = 'pending';
```

---

## ⚠️ Common Mistakes & Fixes

| Mistake | Fix |
|---------|-----|
| Calling server actions from server component | ✅ Just call them (they're server functions) |
| Calling server actions from client without 'use server' | ❌ Use 'use client' + import + await |
| Forgetting to check if user authenticated | ✅ Always call `getAuthenticatedUser()` first |
| Querying plans you're not member of | ✅ RLS will reject, add user to plan first |
| Using mock data instead of database | ✅ Replace with server action calls |
| Hardcoding activity type IDs | ✅ Use `getActivityTypes()` and loop |
| Not handling loading states | ✅ Show skeleton/spinner while fetching |
| Not catching errors | ✅ Wrap in try/catch and show error |

---

## 🔗 Related Documentation

- **SETUP_GUIDE.md** - Complete setup instructions
- **IMPLEMENTATION_SUMMARY.md** - What was built
- **supabase/schema.sql** - Database schema
- **supabase/README.md** - Database docs

---

**Last updated:** 2024
**Status:** ✅ Complete and ready to use
