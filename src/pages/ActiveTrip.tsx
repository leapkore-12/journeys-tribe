import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Pause, Play, AlertTriangle, MapPin, Navigation, Clock, 
  Users, ChevronUp, Phone, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistance, formatDuration, mockUsers } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const ActiveTrip = () => {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showConvoy, setShowConvoy] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);

  // Simulate trip progress
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      setDistance(prev => prev + 0.1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleEndTrip = () => {
    navigate('/trip/complete');
  };

  const convoyMembers = mockUsers.filter(u => u.id !== 'current').slice(0, 2);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full Screen Map Placeholder */}
      <div className="absolute inset-0 bg-secondary">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Navigation className="h-16 w-16 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium">Live Navigation</p>
            <p className="text-sm">Mapbox token required</p>
          </div>
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="absolute top-0 left-0 right-0 safe-top bg-gradient-to-b from-background/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-card/90 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="font-bold text-foreground">{formatDistance(Math.round(distance))}</p>
            </div>
            <div className="bg-card/90 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-bold text-foreground">{formatDuration(Math.floor(elapsedTime / 60))}</p>
            </div>
          </div>
          
          {/* Convoy Button */}
          {convoyMembers.length > 0 && (
            <button
              onClick={() => setShowConvoy(true)}
              className="bg-card/90 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-primary" />
              <div className="flex -space-x-2">
                {convoyMembers.map(member => (
                  <Avatar key={member.id} className="h-6 w-6 border-2 border-card">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ETA Display */}
      <div className="absolute top-24 left-4 right-4">
        <div className="bg-card/90 backdrop-blur rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Next Stop</p>
              <p className="font-semibold text-foreground">San Francisco, CA</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">ETA</p>
              <p className="font-semibold text-foreground">2h 45m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 safe-bottom bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4">
        <div className="space-y-4">
          {/* Pause/Resume & End Trip */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              className="flex-1 h-14 bg-card border-border"
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              onClick={handleEndTrip}
              className="flex-1 h-14 bg-primary hover:bg-primary/90"
            >
              End Trip
            </Button>
          </div>

          {/* SOS Button */}
          <Button
            variant="destructive"
            onClick={() => setShowSOS(true)}
            className="w-full h-12 bg-destructive hover:bg-destructive/90"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            SOS Emergency
          </Button>
        </div>
      </div>

      {/* SOS Modal */}
      {showSOS && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-background/95 backdrop-blur z-50 flex items-center justify-center p-4"
        >
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border border-destructive">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Emergency SOS</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your location will be shared with emergency contacts
              </p>
            </div>
            
            <div className="space-y-3">
              <a
                href="tel:911"
                className="flex items-center justify-center gap-2 w-full h-12 bg-destructive text-destructive-foreground rounded-lg font-semibold"
              >
                <Phone className="h-5 w-5" />
                Call 911
              </a>
              <Button
                variant="outline"
                onClick={() => setShowSOS(false)}
                className="w-full h-12"
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Convoy Panel */}
      {showConvoy && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border z-40"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Convoy Members</h3>
              <button onClick={() => setShowConvoy(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              {convoyMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-primary">0.3 mi behind</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ActiveTrip;
