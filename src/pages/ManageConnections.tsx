import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { mockUsers, getCurrentUser, User } from '@/lib/mock-data';

// Mock connections data
interface Connection {
  id: string;
  user: User;
  isFollowing: boolean;
  isFollowingYou: boolean;
}

const generateMockConnections = (): Connection[] => {
  const currentUser = getCurrentUser();
  return mockUsers
    .filter(u => u.id !== currentUser.id)
    .map((user, index) => ({
      id: `conn-${user.id}`,
      user,
      isFollowing: index < 2, // First 2 users are being followed
      isFollowingYou: true,   // All are following the current user
    }));
};

const generateMockFollowing = (): Connection[] => {
  const currentUser = getCurrentUser();
  return mockUsers
    .filter(u => u.id !== currentUser.id)
    .map((user, index) => ({
      id: `following-${user.id}`,
      user,
      isFollowing: true,
      isFollowingYou: index < 2, // First 2 also follow back
    }));
};

interface FollowRequest {
  id: string;
  user: User;
  requestedAt: Date;
}

const generateMockRequests = (): FollowRequest[] => {
  // Only return requests if current user is private
  const currentUser = getCurrentUser();
  if (!currentUser.isPrivate) return [];
  
  return [
    {
      id: 'req-1',
      user: mockUsers[0],
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];
};

const ManageConnections = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  const [activeTab, setActiveTab] = useState('following');
  const [following, setFollowing] = useState<Connection[]>(generateMockFollowing());
  const [followers, setFollowers] = useState<Connection[]>(generateMockConnections());
  const [requests, setRequests] = useState<FollowRequest[]>(generateMockRequests());

  const handleToggleFollow = (userId: string, isCurrentlyFollowing: boolean, listType: 'following' | 'followers') => {
    const user = mockUsers.find(u => u.id === userId);
    
    if (listType === 'following') {
      setFollowing(prev => 
        prev.map(conn => 
          conn.user.id === userId 
            ? { ...conn, isFollowing: !isCurrentlyFollowing }
            : conn
        )
      );
    } else {
      setFollowers(prev => 
        prev.map(conn => 
          conn.user.id === userId 
            ? { ...conn, isFollowing: !isCurrentlyFollowing }
            : conn
        )
      );
    }
    
    toast({
      description: isCurrentlyFollowing 
        ? `You unfollowed ${user?.username}` 
        : `You followed ${user?.username}`,
    });
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    setRequests(prev => prev.filter(r => r.id !== requestId));
    
    // Add to followers
    if (request) {
      setFollowers(prev => [
        ...prev,
        {
          id: `conn-${request.user.id}`,
          user: request.user,
          isFollowing: false,
          isFollowingYou: true,
        }
      ]);
    }
    
    toast({
      description: `Accepted ${request?.user.username}'s follow request`,
    });
  };

  const handleDeclineRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    setRequests(prev => prev.filter(r => r.id !== requestId));
    
    toast({
      description: `Declined ${request?.user.username}'s follow request`,
    });
  };

  // Sort followers: mutual follows first, then non-mutual
  const sortedFollowers = [...followers].sort((a, b) => {
    if (a.isFollowing && !b.isFollowing) return -1;
    if (!a.isFollowing && b.isFollowing) return 1;
    return 0;
  });

  const ConnectionItem = ({ 
    connection, 
    listType 
  }: { 
    connection: Connection; 
    listType: 'following' | 'followers';
  }) => (
    <div 
      className="flex items-center justify-between py-3 cursor-pointer"
      onClick={() => navigate(`/user/${connection.user.id}`)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={connection.user.avatar} alt={connection.user.name} />
          <AvatarFallback>{connection.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">{connection.user.name}</span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className={`min-w-[100px] ${
          connection.isFollowing 
            ? 'border-primary text-primary hover:bg-primary/10' 
            : 'border-primary text-primary hover:bg-primary/10'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          handleToggleFollow(connection.user.id, connection.isFollowing, listType);
        }}
      >
        {listType === 'following' 
          ? (connection.isFollowing ? 'Following' : 'Follow')
          : (connection.isFollowing ? 'Following' : 'Follow back')
        }
      </Button>
    </div>
  );

  const RequestItem = ({ request }: { request: FollowRequest }) => (
    <div 
      className="flex items-center justify-between py-3"
    >
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate(`/user/${request.user.id}`)}
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={request.user.avatar} alt={request.user.name} />
          <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">{request.user.name}</span>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => handleAcceptRequest(request.id)}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-muted-foreground text-muted-foreground hover:bg-muted"
          onClick={() => handleDeclineRequest(request.id)}
        >
          Decline
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-6 h-6 flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground">
            Manage connections
          </h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          {currentUser.isPrivate && (
            <TabsTrigger 
              value="requests"
              className="flex-1 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground font-medium relative"
            >
              Requests
              {requests.length > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-destructive rounded-full" />
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <div className="px-4">
          <TabsContent value="following" className="mt-0">
            {following.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                You're not following anyone yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {following.map(conn => (
                  <ConnectionItem key={conn.id} connection={conn} listType="following" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-0">
            {sortedFollowers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No followers yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedFollowers.map(conn => (
                  <ConnectionItem key={conn.id} connection={conn} listType="followers" />
                ))}
              </div>
            )}
          </TabsContent>

          {currentUser.isPrivate && (
            <TabsContent value="requests" className="mt-0">
              {requests.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {requests.map(req => (
                    <RequestItem key={req.id} request={req} />
                  ))}
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
