-- ============================================================================
-- MEETMAP DATABASE SCHEMA
-- Run this file in Supabase SQL Editor to set up the complete database
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- ============================================================================
-- 1. USER_PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  last_location_update TIMESTAMP DEFAULT NOW(),
  plans_hosted INTEGER DEFAULT 0,
  plans_joined INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user location for geo queries
CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- ============================================================================
-- 2. ACTIVITY_TYPES TABLE (Reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  color_hex TEXT DEFAULT '#00D9FF',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default activity types
INSERT INTO activity_types (name, description, icon_emoji, color_hex) VALUES
  ('Coffee', 'Coffee meetups and cafe sessions', '☕', '#8B4513'),
  ('Gaming', 'Video games and board games', '🎮', '#FF1493'),
  ('Hiking', 'Trail walks and outdoor hiking', '🥾', '#228B22'),
  ('Reading', 'Book clubs and reading groups', '📚', '#4169E1'),
  ('Sports', 'Sports activities and fitness', '⚽', '#FF6347'),
  ('Art', 'Art exhibitions and creative sessions', '🎨', '#FFD700'),
  ('Music', 'Concerts, jams, and music events', '🎵', '#FF00FF'),
  ('Food', 'Dining and food tasting events', '🍽️', '#FF8C00'),
  ('Tech', 'Tech talks and coding meetups', '💻', '#00FF00'),
  ('Networking', 'Professional networking events', '🤝', '#1E90FF')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_type_id UUID NOT NULL REFERENCES activity_types(id),
  venue_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_point GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 1,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'hard')),
  is_public BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create geospatial index for efficient distance queries
CREATE INDEX idx_plans_location ON plans USING GIST (location_point);
CREATE INDEX idx_plans_host ON plans(host_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plans_start_time ON plans(start_time);

-- ============================================================================
-- 4. PLAN_PARTICIPANTS TABLE (Join Relationship)
-- ============================================================================
CREATE TABLE IF NOT EXISTS plan_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'left')),
  joined_at TIMESTAMP DEFAULT NOW(),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewed_at TIMESTAMP,
  UNIQUE(plan_id, user_id)
);

CREATE INDEX idx_plan_participants_plan ON plan_participants(plan_id);
CREATE INDEX idx_plan_participants_user ON plan_participants(user_id);
CREATE INDEX idx_plan_participants_status ON plan_participants(status);

-- ============================================================================
-- 5. JOIN_REQUESTS TABLE (Pending Approvals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  responded_at TIMESTAMP,
  UNIQUE(plan_id, user_id)
);

CREATE INDEX idx_join_requests_plan ON join_requests(plan_id);
CREATE INDEX idx_join_requests_user ON join_requests(user_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);

-- ============================================================================
-- 6. CHAT_MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'message' CHECK (message_type IN ('message', 'system', 'announcement')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_plan ON chat_messages(plan_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- ============================================================================
-- 7. INTEREST_TAGS TABLE (Reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS interest_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color_hex TEXT DEFAULT '#00D9FF',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default interests
INSERT INTO interest_tags (name, color_hex) VALUES
  ('gaming', '#FF1493'),
  ('coffee', '#8B4513'),
  ('hiking', '#228B22'),
  ('reading', '#4169E1'),
  ('sports', '#FF6347'),
  ('art', '#FFD700'),
  ('music', '#FF00FF'),
  ('food', '#FF8C00'),
  ('tech', '#00FF00'),
  ('networking', '#1E90FF'),
  ('photography', '#FF69B4'),
  ('cooking', '#FF8C00')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 8. USER_INTEREST_MAPPINGS TABLE (Junction Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_interest_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interest_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, interest_id)
);

CREATE INDEX idx_user_interests_user ON user_interest_mappings(user_id);
CREATE INDEX idx_user_interests_interest ON user_interest_mappings(interest_id);

-- ============================================================================
-- 9. PLAN_IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS plan_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plan_images_plan ON plan_images(plan_id);

-- ============================================================================
-- 10. USER_PRESENCE TABLE (Online Status)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Get nearby plans within radius (in km)
CREATE OR REPLACE FUNCTION get_nearby_plans(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 5
)
RETURNS TABLE (
  plan_id UUID,
  title TEXT,
  venue_name TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  start_time TIMESTAMP,
  activity_type TEXT,
  host_name TEXT,
  current_participants INTEGER,
  max_participants INTEGER
) AS $$
SELECT
  p.id,
  p.title,
  p.venue_name,
  p.latitude,
  p.longitude,
  ROUND(ST_DistanceSphere(ST_MakePoint(user_lng, user_lat), ST_MakePoint(p.longitude, p.latitude))::NUMERIC / 1000, 2) as distance_km,
  p.start_time,
  at.name,
  up.full_name,
  p.current_participants,
  p.max_participants
FROM plans p
JOIN activity_types at ON p.activity_type_id = at.id
JOIN user_profiles up ON p.host_id = up.id
WHERE ST_DWithin(
  ST_MakePoint(p.longitude, p.latitude)::GEOGRAPHY,
  ST_MakePoint(user_lng, user_lat)::GEOGRAPHY,
  radius_km * 1000
)
AND p.status = 'active'
AND p.start_time > NOW()
ORDER BY distance_km ASC;
$$ LANGUAGE SQL STABLE;

-- Get plan distance from user
CREATE OR REPLACE FUNCTION get_plan_distance(
  plan_id UUID,
  user_lat DECIMAL,
  user_lng DECIMAL
)
RETURNS DECIMAL AS $$
SELECT ROUND(
  ST_DistanceSphere(
    ST_MakePoint(user_lng, user_lat),
    ST_MakePoint(p.longitude, p.latitude)
  )::NUMERIC / 1000,
  2
)
FROM plans p
WHERE p.id = plan_id;
$$ LANGUAGE SQL STABLE;

-- Get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  plans_hosted INTEGER,
  plans_joined INTEGER,
  average_rating DECIMAL,
  total_connections INTEGER
) AS $$
SELECT
  (SELECT COUNT(*) FROM plans WHERE host_id = user_id AND status = 'completed'),
  (SELECT COUNT(*) FROM plan_participants WHERE user_id = user_id AND status = 'approved'),
  (SELECT AVG(rating) FROM plan_participants WHERE user_id = user_id AND rating IS NOT NULL),
  (SELECT COUNT(DISTINCT pp.user_id) FROM plan_participants pp
   JOIN plans p ON pp.plan_id = p.id
   WHERE p.host_id = user_id OR pp.user_id = user_id)
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interest_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can read all profiles, update only their own
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Plans: All can read public plans
CREATE POLICY "Anyone can read active plans" ON plans FOR SELECT USING (status = 'active' OR host_id = auth.uid());
CREATE POLICY "Users can create plans" ON plans FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Users can update their own plans" ON plans FOR UPDATE USING (auth.uid() = host_id);

-- Plan Participants: Can read if part of plan
CREATE POLICY "Users can read plan participants" ON plan_participants FOR SELECT USING (
  plan_id IN (SELECT id FROM plans WHERE host_id = auth.uid() OR id IN (
    SELECT plan_id FROM plan_participants WHERE user_id = auth.uid()
  ))
);

-- Chat Messages: Can read if part of plan
CREATE POLICY "Users can read chat if member" ON chat_messages FOR SELECT USING (
  plan_id IN (
    SELECT id FROM plans WHERE host_id = auth.uid() OR id IN (
      SELECT plan_id FROM plan_participants WHERE user_id = auth.uid() AND status = 'approved'
    )
  )
);
CREATE POLICY "Users can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  plan_id IN (SELECT plan_id FROM plan_participants WHERE user_id = auth.uid() AND status = 'approved')
);

-- Join Requests: Host can read their own, users can read their own
CREATE POLICY "Users can read join requests" ON join_requests FOR SELECT USING (
  user_id = auth.uid() OR
  plan_id IN (SELECT id FROM plans WHERE host_id = auth.uid())
);
CREATE POLICY "Users can create join requests" ON join_requests FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Interests: Anyone can read
CREATE POLICY "Anyone can read interests" ON user_interest_mappings FOR SELECT USING (true);
CREATE POLICY "Users can manage their interests" ON user_interest_mappings FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their interests" ON user_interest_mappings FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update user stats when plan status changes
CREATE OR REPLACE FUNCTION update_user_stats_on_plan_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE user_profiles
    SET plans_hosted = plans_hosted + 1
    WHERE id = NEW.host_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_on_plan_complete
AFTER UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_plan_complete();

-- Auto-update plan participants count
CREATE OR REPLACE FUNCTION update_plan_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE plans
    SET current_participants = current_participants + 1
    WHERE id = NEW.plan_id;
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE plans
    SET current_participants = current_participants - 1
    WHERE id = NEW.plan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_participant_count
AFTER UPDATE ON plan_participants
FOR EACH ROW
EXECUTE FUNCTION update_plan_participant_count();

-- Auto-create user profile when new user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- All tables are now ready for use. Next steps:
-- 1. Run this schema in Supabase SQL Editor
-- 2. Set up Google OAuth in Supabase Authentication
-- 3. Update .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
-- ============================================================================
