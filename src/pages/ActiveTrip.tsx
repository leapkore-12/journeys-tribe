import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Phone, ArrowUp, Mic, Compass,
  Search, X, AlertTriangle, LocateFixed, Route
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrip } from '@/context/TripContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMapboxRoute } from '@/hooks/useMapboxRoute';
import { useConvoyPresence } from '@/hooks/useConvoyPresence';
import LiveTrackingMap from '@/components/map/LiveTrackingMap';
import logoWhite from '@/assets/logo-white.svg';

const ActiveTrip = () => {
  const navigate = useNavigate();
  const { tripState, pauseTrip, updateProgress } = useTrip();
  const [showSOS, setShowSOS] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(tripState.timeElapsed);
  const [distance, setDistance] = useState(tripState.distanceCovered);
  const [activeTripId] = useState(() => crypto.randomUUID()); // Generate trip ID for presence
  const watchIdRef = useRef<number | null>(null);

  // Real GPS tracking
  const { 
    position: userPosition, 
    heading,
    speed,
    startWatching, 
    stopWatching,
    error: geoError 
  } = useGeolocation({ enableHighAccuracy: true });

  // Route fetching
  const { route, getRoute } = useMapboxRoute();

  // Real-time convoy presence tracking
  const { 
    members: convoyMembers, 
    isConnected: isConvoyConnected,
    updatePosition,
    leaveConvoy,
  } = useConvoyPresence({ 
    tripId: activeTripId, 
    enabled: tripState.isActive 
  });

  // Update convoy position when user moves
  useEffect(() => {
    if (userPosition && isConvoyConnected) {
      updatePosition(userPosition, heading, speed);
    }
  }, [userPosition, heading, speed, isConvoyConnected, updatePosition]);

  // Start GPS tracking on mount
  useEffect(() => {
    const id = startWatching();
    if (id) {
      watchIdRef.current = id;
    }
    return () => {
      if (watchIdRef.current) {
        stopWatching(watchIdRef.current);
      }
    };
  }, [startWatching, stopWatching]);

  // Fetch route when we have position and destination
  useEffect(() => {
    if (userPosition && tripState.destinationCoordinates) {
      getRoute(userPosition, tripState.destinationCoordinates);
    }
  }, [userPosition, tripState.destinationCoordinates, getRoute]);

  // Track trip progress
  useEffect(() => {
    if (tripState.isPaused) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        updateProgress(distance + 0.05, newTime);
        return newTime;
      });
      setDistance(prev => prev + 0.05);
    }, 1000);

    return () => clearInterval(interval);
  }, [tripState.isPaused, distance, updateProgress]);

  const handlePauseTrip = async () => {
    await leaveConvoy();
    pauseTrip();
    navigate('/trip/paused');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatETA = () => {
    if (route) {
      const now = new Date();
      now.setSeconds(now.getSeconds() + route.duration);
      return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() + tripState.eta);
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const currentInstruction = route?.steps?.[0]?.instruction || 'Continue straight';
  const remainingDistance = route ? (route.distance / 1000).toFixed(1) : (15 - distance).toFixed(1);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Live Mapbox Map */}
      <div className="absolute inset-0">
        <LiveTrackingMap
          userPosition={userPosition}
          destination={tripState.destinationCoordinates || undefined}
          routeCoordinates={route?.coordinates || tripState.routeCoordinates || undefined}
          convoyMembers={convoyMembers}
        />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 safe-top z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => navigate('/feed')}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          
          <img src={logoWhite} alt="RoadTribe" className="h-6" />
          
          <button 
            onClick={() => setShowSOS(true)}
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-full"
          >
            <Phone className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Direction Banner */}
      <div className="absolute top-20 left-4 right-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-600 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <ArrowUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-lg line-clamp-1">{currentInstruction}</p>
            <p className="text-white/70 text-sm flex items-center gap-1">
              {route?.steps?.[1]?.instruction ? `Then ${route.steps[1].instruction.split(' ').slice(0, 3).join(' ')}` : 'Continue'}
            </p>
          </div>
          <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </button>
        </motion.div>
      </div>

      {/* Right Side Floating Buttons */}
      <div className="absolute right-4 top-1/3 z-10 space-y-3">
        <button className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg">
          <Compass className="h-5 w-5 text-foreground" />
        </button>
        <button className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg">
          <Search className="h-5 w-5 text-foreground" />
        </button>
        <button className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg relative">
          <Route className="h-5 w-5 text-foreground" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
            <X className="h-2.5 w-2.5 text-white" />
          </div>
        </button>
        <button className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg">
          <AlertTriangle className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Re-centre Button and Convoy Status */}
      <div className="absolute left-4 bottom-56 z-10 space-y-2">
        {isConvoyConnected && convoyMembers.length > 0 && (
          <div className="px-3 py-1.5 bg-primary/90 rounded-full flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-primary-foreground font-medium">
              {convoyMembers.length} in convoy
            </span>
          </div>
        )}
        <button 
          className="px-4 py-2 bg-card rounded-full flex items-center gap-2 shadow-lg"
        >
          <LocateFixed className="h-4 w-4 text-foreground" />
          <span className="text-sm text-foreground">Re-centre</span>
        </button>
      </div>

      {/* Bottom Info Card */}
      <div className="absolute bottom-28 left-4 right-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div>
              <p className="text-3xl font-bold text-primary">{formatTime(elapsedTime)}</p>
              <p className="text-sm text-muted-foreground">
                {remainingDistance} km • {formatETA()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Route className="h-5 w-5 text-foreground" />
            </button>
            <button className="px-4 py-2 bg-destructive rounded-full">
              <span className="text-destructive-foreground font-medium">Exit</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Pause Trip Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background z-10">
        <Button
          onClick={handlePauseTrip}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
        >
          Pause trip
        </Button>
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
    </div>
  );
};

export default ActiveTrip;
