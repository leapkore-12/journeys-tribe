import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Flag, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useUserTrips } from '@/hooks/useTrips';
import ProfileTripCard from '@/components/ProfileTripCard';
import { Skeleton } from '@/components/ui/skeleton';

const formatDistance = (km: number) => {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km)} km`;
};

const formatStatsTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
};

const Profile = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: trips, isLoading: tripsLoading } = useUserTrips();
  const [activeTab, setActiveTab] = useState<'trips' | 'stats'>('trips');

  const stats = {
    ytd: {
      trips: profile?.trips_count || 0,
      distance: profile?.total_distance_km || 0,
      timeOnRoad: profile?.total_duration_minutes || 0,
    },
    allTime: {
      trips: profile?.trips_count || 0,
      distance: profile?.total_distance_km || 0,
      timeOnRoad: profile?.total_duration_minutes || 0,
      longestTrip: 0,
    },
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background safe-top pb-24">
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between px-4 h-14">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-6" />
          </div>
        </header>
        <div className="px-4 py-6 space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background safe-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between px-4 h-14">
          <button className="text-primary" onClick={() => navigate('/search')}>
            <Search className="h-6 w-6" />
          </button>
          <span className="text-primary font-medium">@{profile?.username || 'user'}</span>
          <button
            onClick={() => navigate('/settings')}
            className="text-primary"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        {/* Avatar + Name + Stats in one row */}
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-4 border-muted flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
            <AvatarFallback>{profile?.display_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">{profile?.display_name || 'User'}</h2>
            <div className="flex items-center gap-8 mt-2">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">{profile?.trips_count || 0}</span>
                <span className="text-sm text-muted-foreground">trips</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">{profile?.followers_count || 0}</span>
                <span className="text-sm text-muted-foreground">followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">{profile?.following_count || 0}</span>
                <span className="text-sm text-muted-foreground">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-foreground mt-4">{profile?.bio || 'No bio yet'}</p>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <Button
            variant="secondary"
            className="w-full h-11 bg-secondary text-muted-foreground font-medium"
            onClick={() => navigate('/edit-profile')}
          >
            Edit profile
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/manage-followers')}
              className="flex-1 h-11 bg-primary text-primary-foreground font-medium"
            >
              Manage followers
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/garage')}
              className="flex-1 h-11 border-primary text-primary font-medium"
            >
              Manage garage
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'trips'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            <Flag className="h-5 w-5" />
            <span className="font-medium">Trips</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Stats</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-4 py-4">
        {activeTab === 'trips' && (
          <div className="space-y-4">
            {tripsLoading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              ))
            ) : trips && trips.length > 0 ? (
              trips.map((trip) => (
                <ProfileTripCard key={trip.id} trip={trip} />
              ))
            ) : (
              <div className="text-center py-12">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">No trips yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start your first trip and it will appear here
                </p>
                <Button
                  onClick={() => navigate('/trip')}
                  className="mt-4 bg-primary"
                >
                  Plan a Trip
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Year to Date */}
            <div>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                YEAR-TO-DATE
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Trips</span>
                  <span className="text-foreground font-medium">{stats.ytd.trips}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Distance</span>
                  <span className="text-foreground font-medium">{formatDistance(stats.ytd.distance)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Time on road</span>
                  <span className="text-foreground font-medium">{formatStatsTime(stats.ytd.timeOnRoad)}</span>
                </div>
              </div>
            </div>

            {/* All Time */}
            <div>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                ALL TIME
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Longest Trip</span>
                  <span className="text-foreground font-medium">{formatDistance(stats.allTime.longestTrip)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Distance</span>
                  <span className="text-foreground font-medium">{formatDistance(stats.allTime.distance)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-foreground">Time on road</span>
                  <span className="text-foreground font-medium">{formatStatsTime(stats.allTime.timeOnRoad)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
