import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  useFollowing, 
  useFollowers, 
  useFollowRequests,
  useFollowUser,
  useUnfollowUser,
  useAcceptFollowRequest,
  useDeclineFollowRequest
} from '@/hooks/useFollows';
import { useCurrentProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

const ManageConnections = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useCurrentProfile();
  
  const { data: following, isLoading: followingLoading } = useFollowing();
  const { data: followers, isLoading: followersLoading } = useFollowers();
  const { data: requests, isLoading: requestsLoading } = useFollowRequests();
  
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const acceptMutation = useAcceptFollowRequest();
  const declineMutation = useDeclineFollowRequest();

  const handleToggleFollow = (userId: string, isCurrentlyFollowing: boolean, username?: string) => {
    if (isCurrentlyFollowing) {
      unfollowMutation.mutate(userId, {
        onSuccess: () => {
          toast({ description: `You unfollowed @${username || 'user'}` });
        }
      });
    } else {
      followMutation.mutate(userId, {
        onSuccess: () => {
          toast({ description: `You followed @${username || 'user'}` });
        }
      });
    }
  };

  const handleAcceptRequest = (requesterId: string, username?: string) => {
    acceptMutation.mutate(requesterId, {
      onSuccess: () => {
        toast({ description: `Accepted @${username || 'user'}'s follow request` });
      }
    });
  };

  const handleDeclineRequest = (requesterId: string, username?: string) => {
    declineMutation.mutate(requesterId, {
      onSuccess: () => {
        toast({ description: `Declined @${username || 'user'}'s follow request` });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground">
            Manage connections
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="following" className="w-full">
        <TabsList className="w-full bg-transparent border-b border-border rounded-none h-auto p-0">
          <TabsTrigger 
            value="following"
            className="flex-1 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground font-medium"
          >
            Following
          </TabsTrigger>
          <TabsTrigger 
            value="followers"
            className="flex-1 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground font-medium"
          >
            Followers
          </TabsTrigger>
          {profile?.is_private && (
            <TabsTrigger 
              value="requests"
              className="flex-1 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground font-medium relative"
            >
              Requests
              {requests && requests.length > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-destructive rounded-full" />
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <div className="px-4">
          <TabsContent value="following" className="mt-0">
            {followingLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : following && following.length > 0 ? (
              <div className="divide-y divide-border">
                {following.map(conn => (
                  <div 
                    key={conn.id}
                    className="flex items-center justify-between py-3 cursor-pointer"
                    onClick={() => navigate(`/user/${conn.profile.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conn.profile.avatar_url || undefined} alt={conn.profile.display_name || 'User'} />
                        <AvatarFallback>{conn.profile.display_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{conn.profile.display_name || 'User'}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[100px] border-primary text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(conn.profile.id, true, conn.profile.username || undefined);
                      }}
                    >
                      Following
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                You're not following anyone yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-0">
            {followersLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : followers && followers.length > 0 ? (
              <div className="divide-y divide-border">
                {followers.map(conn => (
                  <div 
                    key={conn.id}
                    className="flex items-center justify-between py-3 cursor-pointer"
                    onClick={() => navigate(`/user/${conn.profile.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conn.profile.avatar_url || undefined} alt={conn.profile.display_name || 'User'} />
                        <AvatarFallback>{conn.profile.display_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{conn.profile.display_name || 'User'}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[100px] border-primary text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(conn.profile.id, conn.is_following_back || false, conn.profile.username || undefined);
                      }}
                    >
                      {conn.is_following_back ? 'Following' : 'Follow back'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No followers yet
              </div>
            )}
          </TabsContent>

          {profile?.is_private && (
            <TabsContent value="requests" className="mt-0">
              {requestsLoading ? (
                <div className="space-y-3 py-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : requests && requests.length > 0 ? (
                <div className="divide-y divide-border">
                  {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between py-3">
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate(`/user/${req.profile.id}`)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={req.profile.avatar_url || undefined} alt={req.profile.display_name || 'User'} />
                          <AvatarFallback>{req.profile.display_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{req.profile.display_name || 'User'}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          disabled={acceptMutation.isPending}
                          onClick={() => handleAcceptRequest(req.requester_id, req.profile?.username || undefined)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-muted-foreground text-muted-foreground hover:bg-muted"
                          disabled={declineMutation.isPending}
                          onClick={() => handleDeclineRequest(req.requester_id, req.profile?.username || undefined)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No pending requests
                </div>
              )}
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default ManageConnections;
