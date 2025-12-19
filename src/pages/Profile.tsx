import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Car, Flag, Users, UserPlus, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser, mockTripPosts, formatDistance } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const Profile = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState('trips');

  const userTrips = mockTripPosts.slice(0, 2); // Mock user's trips

  // Mock stats
  const stats = {
    ytd: {
      trips: 12,
      miles: 4567,
      hours: 89,
    },
    allTime: {
      trips: 47,
      miles: 23456,
      hours: 412,
    },
  };

  return (
    <div className="flex flex-col bg-background safe-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
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

        {/* Garage Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/garage')}
          className="w-full mt-4"
        >
          <Car className="h-4 w-4 mr-2" />
          My Garage
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
            value="stats"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Stats
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
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-6">
          {/* YTD Stats */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Year to Date</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.ytd.trips}</p>
                <p className="text-xs text-muted-foreground">Trips</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.ytd.miles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Miles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.ytd.hours}</p>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
            </div>
          </div>

          {/* All Time Stats */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">All Time</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.allTime.trips}</p>
                <p className="text-xs text-muted-foreground">Trips</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.allTime.miles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Miles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.allTime.hours}</p>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
