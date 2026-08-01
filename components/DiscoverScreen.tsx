'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityType, getNearbyPlans, getPlans, type Plan } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import FilterBar from './FilterBar';
import MapComponent from './MapComponent';
import PlansList from './PlansList';
import CreatePlanModal from './CreatePlanModal';
import PlanDetailView from './PlanDetailView';
import { Plus, Map, List, User, LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function DiscoverScreen() {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | undefined>();
  const [selectedDistance, setSelectedDistance] = useState(5);
  const [selectedPlanId, setSelectedPlanId] = useState<string>();
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [detailViewPlan, setDetailViewPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Check auth and load user location + plans on mount
  useEffect(() => {
    const init = async () => {
      console.log('[DiscoverScreen] Initializing...');
      try {
        const supabase = createClient();

        // Check if user is logged in
        // Note: "Auth session missing!" is expected when not logged in — not a real error
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[DiscoverScreen] User logged in:', !!user);
        setIsLoggedIn(!!user);

        // If logged in, fetch user's saved location
        if (user) {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('latitude, longitude, location_name')
              .eq('id', user.id)
              .single();

            if (profile && profile.latitude && profile.longitude) {
              console.log('[DiscoverScreen] User location:', profile.location_name, profile.latitude, profile.longitude);
              setUserLocation({ lat: profile.latitude, lng: profile.longitude });
            } else {
              console.log('[DiscoverScreen] No saved location, using default');
            }
          } catch (profileErr) {
            console.warn('[DiscoverScreen] Could not fetch profile:', profileErr);
          }
        }

        // Load plans from Supabase
        setLoading(true);
        setError(null);
        getPlans()
          .then((data) => {
            console.log(`[DiscoverScreen] Plans loaded: ${data.length} plans`);
            setPlans(data);
            setLoading(false);
          })
          .catch((err) => {
            console.error('[DiscoverScreen] Failed to load plans:', err);
            setError('Failed to load plans from database.');
            setLoading(false);
          });
      } catch (err) {
        console.error('[DiscoverScreen] Init failed:', err);
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleLogout = async () => {
    console.log('[DiscoverScreen] Logging out...');
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.push('/');
  };

  // Filter plans based on selected criteria
  const filteredPlans = useMemo(() => {
    return getNearbyPlans(plans, selectedActivity, selectedDistance);
  }, [plans, selectedActivity, selectedDistance]);

  // For mobile: toggle between map and list
  const showMap = viewMode === 'split' || viewMode === 'map';
  const showList = viewMode === 'split' || viewMode === 'list';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-6 md:py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Discover</h1>
            <p className="text-slate-600 text-sm mt-1">
              Find and join plans near you
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/profile">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-lg gap-2 whitespace-nowrap"
                  >
                    <User size={18} />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-lg gap-2 whitespace-nowrap"
                  >
                    <User size={18} />
                    My Plans
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="lg"
                  className="rounded-lg gap-2 whitespace-nowrap"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="rounded-lg gap-2 whitespace-nowrap"
                >
                  <LogIn size={18} />
                  Sign In
                </Button>
              </Link>
            )}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="lg"
              className="rounded-lg gap-2 whitespace-nowrap"
            >
              <Plus size={18} />
              Create Plan
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <FilterBar
              selectedActivity={selectedActivity}
              selectedDistance={selectedDistance}
              onActivityChange={setSelectedActivity}
              onDistanceChange={setSelectedDistance}
            />
          </div>

          {/* Loading/Error states */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Loading plans...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-red-200">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="rounded-lg">
                Retry
              </Button>
            </div>
          )}

          {/* Mobile View Toggle */}
          {!loading && !error && (
            <div className="md:hidden flex gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex-1 gap-2 rounded-lg"
              >
                <Map size={16} />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 gap-2 rounded-lg"
              >
                <List size={16} />
                List
              </Button>
              {viewMode !== 'split' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('split')}
                  className="flex-1 rounded-lg"
                >
                  Both
                </Button>
              )}
            </div>
          )}

          {/* Content Grid */}
          {!loading && !error && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
              {/* Map Section */}
              {showMap && (
                <div className="hidden md:flex flex-col rounded-2xl overflow-hidden bg-white shadow-md border border-slate-200">
                  <MapComponent
                    plans={filteredPlans}
                    selectedPlanId={selectedPlanId}
                    onPlanSelect={setSelectedPlanId}
                    userLocation={userLocation}
                  />
                </div>
              )}

              {/* Map Section - Mobile */}
              {showMap && viewMode === 'map' && (
                <div className="md:hidden flex-1 rounded-2xl overflow-hidden bg-white shadow-md border border-slate-200">
                  <MapComponent
                    plans={filteredPlans}
                    selectedPlanId={selectedPlanId}
                    onPlanSelect={setSelectedPlanId}
                    userLocation={userLocation}
                  />
                </div>
              )}

              {/* List Section - Mobile */}
              {showList && viewMode === 'list' && (
                <div className="md:hidden flex-1 rounded-2xl overflow-hidden bg-white shadow-md border border-slate-200">
                  <div className="flex-1 overflow-y-auto p-4">
                    <PlansList
                      plans={filteredPlans}
                      selectedPlanId={selectedPlanId}
                      onPlanSelect={setSelectedPlanId}
                      onPlanClick={setDetailViewPlan}
                    />
                  </div>
                </div>
              )}

              {/* List Section - Desktop */}
              {showList && viewMode !== 'list' && (
                <div className="hidden md:flex flex-col rounded-2xl overflow-hidden bg-white shadow-md border border-slate-200">
                  <div className="flex-1 overflow-y-auto p-4">
                    <PlansList
                      plans={filteredPlans}
                      selectedPlanId={selectedPlanId}
                      onPlanSelect={setSelectedPlanId}
                      onPlanClick={setDetailViewPlan}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl gap-0"
        >
          <Plus size={24} />
        </Button>
      </div>

      {/* Create Plan Modal */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Plan Detail View Modal */}
      {detailViewPlan && (
        <PlanDetailView
          plan={detailViewPlan}
          isOpen={!!detailViewPlan}
          onClose={() => setDetailViewPlan(null)}
        />
      )}
    </div>
  );
}