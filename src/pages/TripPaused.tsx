import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/context/TripContext';
import { useFinalizeTrip } from '@/hooks/useFinalizeTrip';

const TripPaused = () => {
  const navigate = useNavigate();
  const { tripState, resumeTrip, finishTrip } = useTrip();
  const { completeTrip } = useFinalizeTrip();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleResume = () => {
    resumeTrip();
    navigate('/trip/active');
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    console.log('[TripPaused] Finishing trip...');
    
    // Use the reliable finalize hook which looks up trip ID from backend if needed
    const success = await completeTrip();
    
    if (success) {
      console.log('[TripPaused] Trip completed successfully');
      finishTrip(); // Update local context
      navigate('/trip/post');
    } else {
      console.error('[TripPaused] Failed to complete trip');
      setIsFinishing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatEta = (minutes: number) => {
    const roundedMinutes = Math.round(minutes);
    if (roundedMinutes < 60) {
      return `${roundedMinutes}m`;
    }
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="flex flex-col bg-background">
      <TripHeader backTo="/trip/active" />
      
      {/* Title */}
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-xl font-semibold text-primary text-center">Trip details</h1>
      </div>

      <div className="flex-1 px-4 pb-24">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Distance covered</p>
            <p className="text-3xl font-bold text-foreground">
              {Math.round(tripState.distanceCovered)} km
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Distance remaining</p>
            <p className="text-3xl font-bold text-foreground">
              {Math.round(tripState.distanceRemaining)} km
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Time on road</p>
            <p className="text-3xl font-bold text-foreground">
              {formatTime(tripState.timeElapsed)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">ETA</p>
            <p className="text-3xl font-bold text-foreground">
              {formatEta(tripState.eta)}
            </p>
          </div>
        </motion.div>

        {/* Convoy Section */}
        {tripState.convoy.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">Convoy with</p>
            <div className="flex -space-x-2">
              {tripState.convoy.map(member => (
                <Avatar key={member.id} className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </motion.div>
        )}

        {/* Divider */}
        <div className="border-t border-border my-8" />

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Button
            variant="outline"
            onClick={handleResume}
            className="w-full h-14 border-secondary bg-secondary hover:bg-muted text-primary font-semibold text-lg"
          >
            Resume Trip
          </Button>
          <Button
            onClick={handleFinish}
            disabled={isFinishing}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
          >
            {isFinishing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Finishing...
              </>
            ) : (
              'Finish Trip'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default TripPaused;
