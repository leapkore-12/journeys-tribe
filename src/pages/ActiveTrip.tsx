import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Phone, ArrowUp, Mic, Navigation, Compass,
  Search, X, AlertTriangle, LocateFixed, Route
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTrip } from '@/context/TripContext';
import logoWhite from '@/assets/logo-white.svg';

const ActiveTrip = () => {
  const navigate = useNavigate();
  const { tripState, pauseTrip, updateProgress } = useTrip();
  const [showSOS, setShowSOS] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(tripState.timeElapsed);
  const [distance, setDistance] = useState(tripState.distanceCovered);

  // Simulated convoy positions on map
  const convoyPositions = tripState.convoy.slice(0, 3);

  // Simulate trip progress
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
  }, [tripState.isPaused]);

  const handlePauseTrip = () => {
    pauseTrip();
    navigate('/trip/paused');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatETA = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + tripState.eta);
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Map Placeholder - Full Screen */}
      <div className="absolute inset-0 bg-[#1a1a2e]">
        {/* Simulated map with gradient */}
        <div className="w-full h-full bg-gradient-to-b from-[#16213e] to-[#1a1a2e] relative">
          {/* Road lines simulation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-full bg-muted-foreground/20" />
          </div>
          
          {/* Convoy avatars on map */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 space-y-8">
            {convoyPositions.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
                style={{ marginLeft: idx % 2 === 0 ? -20 : 20 }}
              >
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
          </div>

          {/* Navigation marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
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
            <p className="text-white font-semibold text-lg">towards Main Rd</p>
            <p className="text-white/70 text-sm flex items-center gap-1">
              Then <ArrowUp className="h-3 w-3 rotate-[-45deg]" />
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

      {/* Re-centre Button */}
      <div className="absolute left-4 bottom-56 z-10">
        <button className="px-4 py-2 bg-card rounded-full flex items-center gap-2 shadow-lg">
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
                {Math.round(15 - distance)} km • {formatETA()}
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
