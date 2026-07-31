# MeetMap Setup Guide - From Mock Data to Production

This guide walks you through setting up MeetMap from scratch with real database, authentication, and all production features.

## Phase 1: Database Setup ✅

### Step 1: Run the Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Open file: `supabase/schema.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (⌘+Enter / Ctrl+Enter)

The schema will automatically create:
- 10 core tables with proper relationships
- PostGIS extensions for geospatial queries
- Row-Level Security (RLS) policies
- Triggers for auto-updating stats
- Utility functions like `get_nearby_plans()`

**Verify it worked:**
- In Supabase dashboard, go to **Tables**
- You should see: `user_profiles`, `plans`, `activity_types`, etc.
- Each table has columns as described in `supabase/README.md`

### Step 2: Configure Environment Variables

Create `.env.local` in project root:

```env
# Supabase - from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://lpxhbwqkjayzgbitknlq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Find these in Supabase Dashboard:
1. Go to **Settings → API**
2. Copy the URL and anon key
3. Paste into `.env.local`

## Phase 2: Authentication Setup

### Step 1: Enable Google OAuth

In Supabase Dashboard:

1. Go to **Authentication → Providers**
2. Find **Google**
3. Click **Enable**
4. Go to [Google Cloud Console](https://console.cloud.google.com)
5. Create a new OAuth 2.0 app:
   - **Authorized redirect URIs**: 
     ```
     https://lpxhbwqkjayzgbitknlq.supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**
6. Return to Supabase → Google provider
7. Paste Client ID and Client Secret
8. Click **Save**

### Step 2: Test Authentication Flow

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/auth/login`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Should redirect to `/auth/callback` then `/dashboard`

✅ **You're now authenticated!**

## Phase 3: Protected Routes

All these routes now require authentication:

- ✅ `/profile` - Only logged-in users
- ✅ `/dashboard` - Only logged-in users
- ✅ `/chat/[planId]` - Only plan members
- 🔓 `/` - Public (Discover page)
- 🔓 `/auth/login` - Public
- 🔓 `/auth/sign-up` - Public

**Trying to access `/profile` without login?**
- Middleware redirects you to `/auth/login`
- After login, you can access protected pages

## Phase 4: Real Data Implementation

### Updated Components Using Real Data:

1. **Profile Page** (`/profile`)
   - Fetches real user data from `user_profiles` table
   - Shows real interests from database
   - Can edit profile with database updates
   - Only shows current user's profile

2. **Discover Screen** (`/`)
   - Uses `get_nearby_plans()` PostGIS function
   - Gets user's location automatically
   - Filters by 5km radius (configurable)
   - Displays distance to each plan

3. **Dashboard** (`/dashboard`)
   - Shows user's created plans
   - Shows user's joined plans
   - Real data from database

4. **Group Chat** (`/chat/[planId]`)
   - Real-time messages from `chat_messages` table
   - Only shows if user is plan member
   - Supabase Realtime subscriptions

## Phase 5: Key Features - How to Use

### Feature 1: Create a Plan

```typescript
// Using the server action
import { createPlan } from '@/lib/actions/plans';

const plan = await createPlan({
  title: 'Morning Coffee Meetup',
  description: 'Coffee and conversation',
  activity_type_id: 'activity-uuid', // From activity_types table
  venue_name: 'Central Brew Cafe',
  latitude: 40.7128,
  longitude: -74.0060,
  start_time: '2024-02-15T09:00:00Z',
  end_time: '2024-02-15T11:00:00Z',
  max_participants: 10,
  difficulty_level: 'easy',
});
```

### Feature 2: Find Nearby Plans

```typescript
import { getPlansNearUser } from '@/lib/actions/plans';

// Get plans within 5km
const plans = await getPlansNearUser(
  40.7128, // latitude
  -74.0060, // longitude
  5 // radius in km
);

// Returns: plan_id, title, distance_km, venue_name, etc.
```

### Feature 3: Join a Plan

```typescript
import { requestToJoinPlan } from '@/lib/actions/joins';

// Request to join a plan
const request = await requestToJoinPlan(
  'plan-id',
  'I love hiking!' // optional message
);

// Plan host then approves/declines via `/dashboard`
```

### Feature 4: Real-Time Chat

```typescript
import { sendChatMessage } from '@/lib/actions/chat';

// Send a message
const message = await sendChatMessage(
  'plan-id',
  'See you soon!' 
);

// Subscribe to new messages (in client component):
supabase
  .channel(`chat:${plan_id}`)
  .on('broadcast', { event: 'new_message' }, (payload) => {
    // Handle new message
  })
  .subscribe();
```

### Feature 5: User Location & Maps

```typescript
import { 
  getCurrentLocation, 
  calculateDistance,
  formatDistance 
} from '@/lib/map-utils';

// Get user's device location
const location = await getCurrentLocation();
// { latitude: 40.7128, longitude: -74.0060 }

// Calculate distance to a plan
const distance = calculateDistance(
  userLat, userLng,
  planLat, planLng
);
// Returns: 2.5 (km)

// Format for display
const formatted = formatDistance(2.5);
// "2.5km"
```

## Phase 6: Database Management

### View Real Data

In Supabase Dashboard:
1. Go to **Table Editor**
2. Select a table (e.g., `user_profiles`)
3. See all rows

### Add Test Data

Option A: UI (Supabase Table Editor)
- Click **Insert Row**
- Fill in values
- Click **Save**

Option B: SQL
```sql
INSERT INTO user_profiles (id, email, full_name, bio, latitude, longitude)
VALUES (
  'user-id',
  'user@example.com',
  'Test User',
  'Love hiking!',
  40.7128,
  -74.0060
);
```

### Query Data with Functions

```sql
-- Find all plans within 5km
SELECT * FROM get_nearby_plans(40.7128, -74.0060, 5);

-- Calculate distance to a specific plan
SELECT get_plan_distance('plan-id', 40.7128, -74.0060);

-- Get user statistics
SELECT * FROM get_user_stats('user-id');
```

## Phase 7: Common Tasks

### Task 1: Edit Profile

```typescript
import { updateUserProfile } from '@/lib/actions/profile';

await updateUserProfile({
  full_name: 'New Name',
  bio: 'New bio here',
  latitude: 40.7580,
  longitude: -73.9855,
});
```

### Task 2: Update Interests

```typescript
import { updateUserInterests } from '@/lib/actions/profile';

// Interest IDs from interest_tags table
await updateUserInterests([
  'interest-id-1', // gaming
  'interest-id-2', // hiking
]);
```

### Task 3: Approve Join Request

```typescript
import { approveMember } from '@/lib/actions/joins';

// Called by plan host from dashboard
await approveMember('join-request-id');
```

### Task 4: Get Chat History

```typescript
import { getChatMessages } from '@/lib/actions/chat';

const messages = await getChatMessages('plan-id', 50);
// Returns last 50 messages with sender details
```

## Troubleshooting

### Issue: "Cannot read property 'getUser' of null"
**Solution**: Supabase keys not set in `.env.local`
- Check env vars match Supabase project
- Restart dev server
- Clear browser cache

### Issue: "Unauthorized: You are not authenticated"
**Solution**: Session cookie expired
- Log out: `/auth/logout`
- Log back in
- Cookies should be refreshed

### Issue: RLS policy errors
**Solution**: User data isn't isolated properly
- Check RLS policies in Supabase dashboard
- Verify user ID matches `auth.uid()`
- See `supabase/schema.sql` for policy setup

### Issue: No nearby plans found
**Solution**: Check location coordinates
- Ensure lat/lng are valid
- Verify plans exist in database
- Check radius isn't too small
- Use `get_nearby_plans()` directly in SQL editor to debug

### Issue: Map not showing plans
**Solution**: Missing geolocation permissions
- Browser must have location permission
- On localhost: browser may ask for permission
- Check browser console for geolocation errors

## Next Steps

1. ✅ Schema imported
2. ✅ Auth configured
3. ✅ Environment variables set
4. ✅ Test user created
5. ⏳ Create some plans
6. ⏳ Request to join
7. ⏳ Test chat
8. ⏳ Review user profiles

## Architecture Overview

```
User (Login with Google)
    ↓
Supabase Auth
    ↓
Session Cookie
    ↓
Middleware (Proxy) - Checks authentication
    ↓
Protected Routes (Redirect to login if not auth)
    ↓
Server Actions (lib/actions/*)
    ↓
Supabase Database with RLS
    ↓
Real Data Returned
```

## Production Checklist

Before deploying to production:

- [ ] All env vars set in Vercel project
- [ ] Google OAuth configured for production domain
- [ ] Supabase RLS policies verified
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] API rate limits set
- [ ] CDN configured for images
- [ ] Email verification enabled
- [ ] Password reset flow tested
- [ ] SSL/HTTPS configured

## Support

For issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console: F12 → Console
3. Check dev server logs: Terminal where `npm run dev` runs
4. Review this guide's troubleshooting section
5. Check `supabase/README.md` for database-specific issues

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
