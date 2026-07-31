# MeetMap Database Setup

This directory contains the database schema for MeetMap using Supabase PostgreSQL.

## Quick Start

### 1. Run the Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (⌘+Enter or Ctrl+Enter)

The schema will automatically:
- Create all 10 tables
- Set up PostGIS for geospatial queries
- Insert default activity types and interest tags
- Create utility functions for nearby plans
- Enable Row-Level Security (RLS) policies
- Set up triggers for auto-updating stats

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lpxhbwqkjayzgbitknlq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Google OAuth (Optional but Recommended)

In Supabase Dashboard:
1. Go to **Authentication → Providers**
2. Enable **Google**
3. Enter your Google Client ID and Secret
4. Set Redirect URL: `https://lpxhbwqkjayzgbitknlq.supabase.co/auth/v1/callback`

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `user_profiles` | User account data | id, email, bio, latitude, longitude, avatar_url |
| `plans` | Activity plans | id, title, venue_name, latitude, longitude, start_time, max_participants |
| `activity_types` | Activity categories | id, name, icon_emoji, color_hex |
| `plan_participants` | Plan members | plan_id, user_id, status (pending/approved) |
| `join_requests` | Pending member requests | plan_id, user_id, message |
| `chat_messages` | Real-time chat | plan_id, sender_id, content |
| `interest_tags` | User interests | id, name |
| `user_interest_mappings` | User → Interests | user_id, interest_id |
| `plan_images` | Plan photos | plan_id, image_url |
| `user_presence` | Online/offline status | user_id, status, last_seen |

### Geospatial Features

- **Location Point**: Each plan has `location_point` (GEOGRAPHY type) for PostGIS queries
- **User Location**: `user_profiles.latitude` and `longitude`
- **Spatial Indexes**: GIST indexes on all location columns for performance
- **Distance Queries**: `get_nearby_plans()` function finds plans within radius

### Utility Functions

```sql
-- Find plans within 5km
SELECT * FROM get_nearby_plans(40.7128, -74.0060, 5);

-- Calculate distance to specific plan
SELECT get_plan_distance('plan-uuid', 40.7128, -74.0060);

-- Get user statistics
SELECT * FROM get_user_stats('user-uuid');
```

### Row-Level Security

- Users can read all public profiles
- Users can only edit their own profile
- Users can only see chat messages in plans they're part of
- Users can only create plans (they become host)
- Hosts can view all participants and join requests for their plans

## Test Data

To populate test data for development:

```sql
-- Create a test user profile
INSERT INTO user_profiles (id, email, full_name, bio, latitude, longitude)
VALUES (
  'test-user-id',
  'test@example.com',
  'Test User',
  'Love hiking and coffee!',
  40.7128,
  -74.0060
);

-- Create a test plan
INSERT INTO plans (host_id, title, activity_type_id, venue_name, latitude, longitude, start_time, end_time, max_participants)
SELECT
  'test-user-id',
  'Morning Coffee Meetup',
  (SELECT id FROM activity_types WHERE name = 'Coffee'),
  'Central Brew Cafe',
  40.7128,
  -74.0060,
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days 2 hours',
  10;
```

## Important Notes

1. **PostGIS Extension**: The schema uses PostGIS for geospatial queries. Supabase includes this by default.

2. **Authentication**: The schema assumes you're using Supabase Auth. User profiles are auto-created via trigger when users sign up.

3. **RLS Policies**: All tables have RLS enabled. Make sure users are authenticated before querying.

4. **Triggers**: Automatic triggers handle:
   - Creating user profiles on signup
   - Updating participant counts on plan joins
   - Updating user stats on plan completion

5. **Performance**: Spatial queries use GIST indexes and are optimized for 50km+ radius searches.

## Troubleshooting

### Error: "Extension postgis not found"
- PostGIS is included with Supabase by default
- If missing, enable it in Supabase dashboard → Extensions

### No results from nearby plans query
- Check that plans have valid coordinates
- Verify user coordinates are correct
- Ensure radius_km is in kilometers (not miles)

### RLS policy errors
- Make sure user is authenticated
- Check that RLS policies are correctly set up
- Verify user has permission for the action

## Next Steps

1. ✅ Run the schema (this file)
2. ⏳ Set up environment variables
3. ⏳ Configure Google OAuth
4. ⏳ Implement server actions for CRUD
5. ⏳ Build map components
6. ⏳ Test authentication flow
