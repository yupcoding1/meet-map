'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, X, MapPin } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LocationPicker, { type SelectedLocation } from '@/components/LocationPicker';

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  avatar_url?: string;
  interests: string[];
  plans_hosted: number;
  plans_joined: number;
}

const AVAILABLE_INTERESTS = [
  'gaming', 'coffee', 'hiking', 'dining', 'shopping',
  'cultural', 'sports', 'photography', 'reading', 'music', 'cooking', 'art',
];

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    interests: [] as string[],
  });
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [locationName, setLocationName] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Fetch user profile from Supabase on mount
  useEffect(() => {
    const fetchProfile = async () => {
      console.log('[Profile] Fetching user profile from Supabase...');
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // Get the current authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          console.log('[Profile] User not authenticated');
          setError('Not authenticated. Please sign in to view your profile.');
          setLoading(false);
          return;
        }
        
        console.log('[Profile] Authenticated user:', authUser.id);
        
        // Fetch profile from user_profiles table
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[Profile] Error fetching profile:', profileError.message);
        }
        
        if (profile) {
          console.log('[Profile] Profile found:', profile);
          setUser({
            id: profile.id,
            name: profile.full_name || authUser.email?.split('@')[0] || 'User',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || undefined,
            interests: [],
            plans_hosted: profile.plans_hosted || 0,
            plans_joined: profile.plans_joined || 0,
          });
          // Load saved location
          if (profile.latitude && profile.longitude) {
            setLocation({
              name: profile.location_name || 'Saved location',
              lat: profile.latitude,
              lng: profile.longitude,
            });
            setLocationName(profile.location_name || '');
          }
        } else {
          console.log('[Profile] No profile found, creating default from auth user');
          // Derive profile from auth user metadata
          const firstName = authUser.user_metadata?.first_name || '';
          const name = firstName ? `${firstName}` : authUser.email?.split('@')[0] || 'User';
          
          setUser({
            id: authUser.id,
            name,
            bio: '',
            avatar_url: undefined,
            interests: [],
            plans_hosted: 0,
            plans_joined: 0,
          });
        }
      } catch (err) {
        console.error('[Profile] Failed to load profile:', err);
        setError('Failed to load profile. Check console for details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  // Initialize edit data when user is loaded
  useEffect(() => {
    if (user && !isEditing) {
      setEditData({
        name: user.name,
        bio: user.bio,
        interests: [...user.interests],
      });
    }
  }, [user, isEditing]);

  const handleToggleInterest = (interest: string) => {
    setEditData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSaveProfile = async () => {
    console.log('[Profile] Saving profile...');
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setError('Not authenticated');
        return;
      }
      
      // Upsert the profile (include email since it's NOT NULL in the schema)
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: editData.name,
          bio: editData.bio,
          latitude: location?.lat,
          longitude: location?.lng,
          location_name: location?.name,
          updated_at: new Date().toISOString(),
        });
      
      if (upsertError) {
        console.error('[Profile] Error saving profile:', upsertError.message);
        setError('Failed to save profile');
        return;
      }
      
      console.log('[Profile] Profile saved successfully');
      setUser((prev) => prev ? {
        ...prev,
        name: editData.name,
        bio: editData.bio,
        interests: editData.interests,
      } : prev);
      setIsEditing(false);
    } catch (err) {
      console.error('[Profile] Failed to save profile:', err);
      setError('Failed to save profile');
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name,
        bio: user.bio,
        interests: [...user.interests],
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/auth/login">
            <Button className="rounded-lg">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="rounded-lg gap-2">
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-900">
              {isEditing ? 'Edit Profile' : 'Profile'}
            </h1>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="rounded-lg"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 md:px-6">
        {/* Avatar Section */}
        <div className="mb-8">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-teal-600">
                  {user.name[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Your name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleToggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        editData.interests.includes(interest)
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 rounded-lg"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-8">
              {/* Name and Bio */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  {user.name}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {user.bio || 'No bio yet.'}
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {user.plans_hosted}
                  </p>
                  <p className="text-sm text-slate-600">Plans Hosted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {user.plans_joined}
                  </p>
                  <p className="text-sm text-slate-600">Plans Joined</p>
                </div>
              </div>

              {/* Location Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Your Location
                </h3>
                {location && location.lat !== 0 ? (
                  <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <MapPin size={16} className="text-teal-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{location.name}</div>
                      <div className="text-xs text-slate-600">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className="rounded-lg"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="text-sm text-slate-600 mb-3">
                      Set your location to find plans near you
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className="rounded-lg gap-2"
                    >
                      <MapPin size={16} />
                      Set Location
                    </Button>
                  </div>
                )}
                {showLocationPicker && (
                  <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg">
                    <LocationPicker
                      value={locationName}
                      onChange={setLocationName}
                      onSelect={(loc) => {
                        console.log('[Profile] Location selected:', loc);
                        setLocation(loc);
                        setLocationName(loc.name);
                      }}
                      selectedLocation={location}
                      placeholder="Enter your location name..."
                    />
                    <Button
                      size="sm"
                      className="mt-3 w-full rounded-lg"
                      onClick={async () => {
                        console.log('[Profile] Saving location...');
                        const supabase = createClient();
                        const { data: { user: authUser } } = await supabase.auth.getUser();
                        if (authUser && location) {
                          await supabase
                            .from('user_profiles')
                            .upsert({
                              id: authUser.id,
                              email: authUser.email,
                              latitude: location.lat,
                              longitude: location.lng,
                              location_name: location.name,
                              updated_at: new Date().toISOString(),
                            });
                          console.log('[Profile] Location saved');
                          setShowLocationPicker(false);
                        }
                      }}
                    >
                      Save Location
                    </Button>
                  </div>
                )}
              </div>

              {/* Interests Tags */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.length > 0 ? (
                    user.interests.map((interest) => (
                      <div
                        key={interest}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-teal-100 text-teal-700"
                      >
                        {interest}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No interests selected yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
