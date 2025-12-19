import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, Flag, Users, UserPlus, UserMinus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockUsers, mockTripPosts, formatDistance } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('trips');
  
  const user = mockUsers.find(u => u.id === userId) || mockUsers[0];
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);

  const userTrips = mockTripPosts.filter(p => p.user.id === userId).slice(0, 2);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: isFollowing 
        ? `You unfollowed ${user.name}` 
        : `You are now following ${user.name}`,
    });
  };

  return (
    <div className="flex flex-col bg-background safe-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{user.username}</h1>
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-4 border-primary">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-muted-foreground">{user.username}</p>
            {user.mutuals && user.mutuals.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                <Users className="h-3 w-3 inline mr-1" />
                Mutuals: {user.mutuals.join(', ')}
              </p>
            )}
            <p className="text-sm text-foreground mt-2">{user.bio}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-around py-4 mt-4 bg-card rounded-xl border border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{user.tripsCount}</p>
            <p className="text-xs text-muted-foreground">Trips</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{user.followersCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{user.followingCount}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Follow Button */}
        <Button
          onClick={handleFollow}
          variant={isFollowing ? "outline" : "default"}
          className={`w-full mt-4 ${!isFollowing ? 'bg-primary' : ''}`}
        >
          {isFollowing ? (
            <>
              <UserMinus className="h-4 w-4 mr-2" />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Follow
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger 
            value="trips" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Trips
          </TabsTrigger>
          <TabsTrigger 
            value="garage"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Garage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4 space-y-4">
          {userTrips.length > 0 ? (
            userTrips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl overflow-hidden border border-border"
              >
                <div className="aspect-video bg-secondary relative">
                  {trip.photos[0] ? (
                    <img 
                      src={trip.photos[0]} 
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <MapPin className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground">{trip.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistance(trip.distance)} · {trip.startLocation} → {trip.endLocation}
                  </p>
                </div>
              </motion.div>
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
        </TabsContent>

        <TabsContent value="garage" className="mt-4">
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">Garage is Private</h3>
            <p className="text-sm text-muted-foreground">
              Follow {user.name} to see their garage
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
