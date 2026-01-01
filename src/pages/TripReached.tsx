import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/context/TripContext';
import { useFinalizeTrip } from '@/hooks/useFinalizeTrip';

const TripReached = () => {
  const navigate = useNavigate();
  const { tripState, finishTrip, resetTrip } = useTrip();
  const { completeTrip } = useFinalizeTrip();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleAddDestination = () => {
    // Reset to step 2 to add new destination
    navigate('/trip');
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    console.log('[TripReached] Finishing trip...');
    
    // Use the reliable finalize hook which looks up trip ID from backend if needed
    const success = await completeTrip();
    
    if (success) {
      console.log('[TripReached] Trip completed successfully');
      finishTrip(); // Update local context
      navigate('/trip/post');
    } else {
      console.error('[TripReached] Failed to complete trip');
      setIsFinishing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex flex-col bg-background">
      <TripHeader backTo="/trip/active" />
      
      {/* Title */}
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-xl font-semibold text-primary text-center">Trip details</h1>
      </div>

      <div className="flex-1 px-4 pb-24">
        {/* Stats - Single Column for Reached */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mb-8"
        >
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Distance covered</p>
            <p className="text-4xl font-bold text-foreground">
              {Math.round(tripState.distanceCovered)} km
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Time on road</p>
            <p className="text-4xl font-bold text-foreground">
              {formatTime(tripState.timeElapsed)}
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
            variant="secondary"
            onClick={handleAddDestination}
            className="w-full h-14 bg-secondary hover:bg-muted text-foreground font-semibold text-lg"
          >
            Add new destination
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

export default TripReached;
