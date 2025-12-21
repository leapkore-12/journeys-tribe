import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Settings, Flag, BarChart3, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUsers, mockTripPosts, formatDistance, formatStatsTime } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import ProfileTripCard from '@/components/ProfileTripCard';

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'trips' | 'stats'>('trips');
  
  const user = mockUsers.find(u => u.id === userId) || mockUsers[0];
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);

  const userTrips = mockTripPosts.filter(p => p.user.id === userId);

  const stats = user.stats || {
    ytd: { trips: 48, distance: 2548, timeOnRoad: 5394 },
    allTime: { trips: 160, distance: 10886, timeOnRoad: 9066, longestTrip: 1200 },
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: isFollowing 
        ? `You unfollowed ${user.name}` 
        : `You are now following ${user.name}`,
    });
  };

  const mutualFollowers = user.mutualFollowers;

  return (
    <div className="flex flex-col min-h-screen bg-background safe-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between px-4 h-14">
          <button className="text-primary">
            <Search className="h-6 w-6" />
          </button>
          <span className="text-primary font-medium">{user.username}</span>
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
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
            <div className="flex items-center gap-8 mt-2">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">{user.tripsCount}</span>
                <span className="text-sm text-muted-foreground">trips</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">{user.followersCount}</span>
                <span className="text-sm text-muted-foreground">followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">{user.vehiclesCount}</span>
                <span className="text-sm text-muted-foreground">vehicles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-foreground mt-4">{user.bio}</p>

        {/* Mutual Followers */}
        {mutualFollowers && mutualFollowers.users.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex -space-x-2">
              {mutualFollowers.users.slice(0, 3).map((mutualUser, index) => (
                <Avatar key={mutualUser.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={mutualUser.avatar} alt={mutualUser.username} />
                  <AvatarFallback>{mutualUser.username[1]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Followed by{' '}
              <span className="text-foreground font-medium">
                {mutualFollowers.users.slice(0, 2).map(u => u.username.replace('@', '')).join(', ')}
              </span>
              {mutualFollowers.total > 2 && (
                <span className="text-muted-foreground">
                  {' '}and <span className="text-foreground font-medium">{mutualFollowers.total - 2} others</span>
                </span>
              )}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleFollow}
            className={`flex-1 h-11 font-medium ${
              isFollowing
                ? 'bg-secondary text-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/user/${userId}/garage`)}
            className="flex-1 h-11 border-primary text-primary font-medium"
          >
            <Car className="h-4 w-4 mr-2" />
            Garage
          </Button>
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
            {userTrips.length > 0 ? (
              userTrips.map((trip) => (
                <ProfileTripCard key={trip.id} trip={trip} />
              ))
            ) : (
              <div className="text-center py-12">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">No trips yet</h3>
                <p className="text-sm text-muted-foreground">
                  {user.name} hasn't posted any trips
                </p>
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

export default UserProfile;
