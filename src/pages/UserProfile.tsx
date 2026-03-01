import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Flag, BarChart3, Car, ArrowLeft, Lock, MoreVertical, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useUserTrips } from '@/hooks/useTrips';
import { 
  useIsFollowing, 
  useFollowUser, 
  useUnfollowUser, 
  usePendingRequest, 
  useCancelFollowRequest,
  useMutualFollowers 
} from '@/hooks/useFollows';
import { useBlockUser, useIsBlocked, useUnblockUser, useIsBlockedBy } from '@/hooks/useBlockedUsers';
import ProfileTripCard from '@/components/ProfileTripCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

const UserProfile = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate('/feed');
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'trips' | 'stats'>('trips');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  
  // All hooks must be called before any conditional returns
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: trips, isLoading: tripsLoading } = useUserTrips(userId);
  const { data: isFollowing } = useIsFollowing(userId || '');
  const { data: pendingRequest } = usePendingRequest(userId || '');
  const { data: mutualFollowers } = useMutualFollowers(userId || '');
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const cancelRequestMutation = useCancelFollowRequest();
  const { data: isBlocked } = useIsBlocked(userId);
  const { data: isBlockedByUser, isLoading: blockedByLoading } = useIsBlockedBy(userId);
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  // If viewing own profile, redirect to /profile (after all hooks are called)
  if (user && userId === user.id) {
    return <Navigate to="/profile" replace />;
  }

  // Determine if this is a private account and viewer can see content
  const isPrivateAccount = profile?.is_private === true;
  const canViewContent = !isPrivateAccount || isFollowing;

  // Determine button state: 'follow' | 'requested' | 'following'
  const getFollowState = () => {
    if (isFollowing) return 'following';
    if (pendingRequest) return 'requested';
    return 'follow';
  };

  const followState = getFollowState();

  const handleFollowAction = () => {
    if (!userId) return;
    
    if (followState === 'following') {
      unfollowMutation.mutate(userId, {
        onSuccess: () => {
          toast({
            title: "Unfollowed",
            description: `You unfollowed ${profile?.display_name || 'this user'}`,
          });
        }
      });
    } else if (followState === 'requested') {
      cancelRequestMutation.mutate(userId, {
        onSuccess: () => {
          toast({
            title: "Request cancelled",
            description: "Your follow request has been cancelled",
          });
        }
      });
    } else {
      followMutation.mutate(userId, {
        onSuccess: (result) => {
          if (result.type === 'request') {
            toast({
              title: "Request sent",
              description: `Follow request sent to ${profile?.display_name || 'this user'}`,
            });
          } else {
            toast({
              title: "Following",
              description: `You are now following ${profile?.display_name || 'this user'}`,
            });
          }
        }
      });
    }
  };

  const getButtonText = () => {
    if (followState === 'following') return 'Following';
    if (followState === 'requested') return 'Requested';
    return 'Follow';
  };

  const getButtonStyle = () => {
    if (followState === 'following') return 'bg-secondary text-foreground';
    if (followState === 'requested') return 'bg-muted text-muted-foreground';
    return 'bg-primary text-primary-foreground';
  };

  const handleBlockAction = () => {
    if (!userId) return;
    
    if (isBlocked) {
      unblockUserMutation.mutate(userId, {
        onSuccess: () => {
          toast({
            title: "User unblocked",
            description: `${profile?.display_name || 'This user'} has been unblocked`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to unblock user. Please try again.",
            variant: "destructive",
          });
        }
      });
    } else {
      blockUserMutation.mutate(userId, {
        onSuccess: () => {
          toast({
            title: "User blocked",
            description: `${profile?.display_name || 'This user'} has been blocked`,
          });
          handleBack();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to block user. Please try again.",
            variant: "destructive",
          });
        }
      });
    }
    setShowBlockDialog(false);
  };

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

  if (profileLoading || blockedByLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={handleBack} className="text-primary min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <Skeleton className="h-4 w-24" />
            <div className="w-6" />
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

  // If the profile owner has blocked the current user, show "not found" screen
  if (isBlockedByUser) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={handleBack} className="text-primary min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <span className="text-primary font-medium">Profile</span>
            <div className="w-6" />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-20 h-20 rounded-full border-2 border-muted-foreground flex items-center justify-center mb-4">
            <ShieldOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">User not found</h3>
          <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">
            This profile is not available
          </p>
          <Button 
            onClick={handleBack}
            className="mt-6"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={handleBack} className="text-primary min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="text-primary font-medium flex items-center gap-1">
            @{profile?.username || 'user'}
            {isPrivateAccount && <Lock className="h-4 w-4" />}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-primary">
                <MoreVertical className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setShowBlockDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                {isBlocked ? 'Unblock user' : 'Block user'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
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

        {/* Mutual Followers */}
        {mutualFollowers && mutualFollowers.profiles && mutualFollowers.profiles.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {/* Stacked Avatars */}
            <div className="flex -space-x-2">
              {mutualFollowers.profiles.slice(0, 4).map((profile, index) => (
                <Avatar 
                  key={profile.id} 
                  className="h-6 w-6 border-2 border-background"
                  style={{ zIndex: mutualFollowers.profiles.length - index }}
                >
                  <AvatarImage 
                    src={profile.avatar_url || undefined} 
                    alt={profile.display_name || profile.username || 'User'} 
                  />
                  <AvatarFallback className="text-xs">
                    {(profile.display_name?.[0] || profile.username?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            
            {/* Text */}
            <p className="text-sm text-muted-foreground">
              Followed by{' '}
              {mutualFollowers.profiles.slice(0, 3).map((p, i, arr) => (
                <span key={p.id}>
                  <span className="font-semibold text-foreground">
                    {p.display_name || p.username}
                  </span>
                  {i < arr.length - 1 && ', '}
                </span>
              ))}
              {mutualFollowers.totalCount > 3 && (
                <span> and <span className="font-semibold text-foreground">{mutualFollowers.totalCount - 3} others</span></span>
              )}
            </p>
          </div>
        )}

        {/* Bio */}
        <p className="text-foreground mt-4">{profile?.bio || 'No bio yet'}</p>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleFollowAction}
            disabled={followMutation.isPending || unfollowMutation.isPending || cancelRequestMutation.isPending}
            className={`flex-1 h-11 font-medium ${getButtonStyle()}`}
          >
            {getButtonText()}
          </Button>
          {canViewContent && (
            <Button
              variant="outline"
              onClick={() => navigate(`/user/${userId}/garage`)}
              className="flex-1 h-11 border-primary text-primary font-medium"
            >
              <Car className="h-4 w-4 mr-2" />
              Garage
            </Button>
          )}
        </div>
      </div>

      {/* Private Account Message OR Tabs */}
      {!canViewContent ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="w-20 h-20 rounded-full border-2 border-muted-foreground flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">This account is private</h3>
          <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">
            Follow this account to see their trips, stats, and garage
          </p>
        </div>
      ) : (
        <>
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
                      {profile?.display_name || 'This user'} hasn't posted any trips
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
        </>
      )}

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBlocked ? 'Unblock' : 'Block'} @{profile?.username}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBlocked 
                ? 'They will be able to find your profile, trips, and follow you again.'
                : "They won't be able to find your profile, trips, or follow you. They won't be notified that you blocked them."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockAction}
              className={isBlocked ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {isBlocked ? 'Unblock' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

export default UserProfile;
