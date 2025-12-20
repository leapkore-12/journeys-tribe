import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crosshair, Flag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/context/TripContext';
import { Search, Bell } from 'lucide-react';
import logoWhite from '@/assets/logo-white.svg';

const TripReview = () => {
  const navigate = useNavigate();
  const { tripState, startTrip } = useTrip();

  const handleStartTrip = () => {
    startTrip();
    navigate('/trip/active');
  };

  const handleAddStops = () => {
    navigate('/trip');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top">
      {/* Custom header with search */}
      <header className="flex items-center justify-between px-4 h-14 bg-background">
        <button onClick={() => navigate('/search')} className="w-10 h-10 flex items-center justify-center">
          <Search className="h-5 w-5 text-foreground" />
        </button>
        <img src={logoWhite} alt="RoadTribe" className="h-6" />
        <button onClick={() => navigate('/notifications')} className="w-10 h-10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-foreground" />
        </button>
      </header>

      {/* Title */}
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-xl font-semibold text-primary text-center">Trip Planner</h1>
      </div>

      <div className="flex-1 px-4 pb-24 space-y-4">
        {/* Route Section */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Route</label>
          
          {/* Start Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <Crosshair className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{tripState.startLocation}</p>
                <p className="text-sm text-muted-foreground mt-1">Mumbai, Maharashtra</p>
                {tripState.vehicle && (
                  <p className="text-sm text-foreground mt-2">🚗 {tripState.vehicle.name}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Destination Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-secondary rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <Flag className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{tripState.destination || 'Goa, India'}</p>
                <p className="text-sm text-muted-foreground mt-1">Panaji, Goa, India</p>
                <p className="text-sm text-muted-foreground mt-1">241 km • 6h 7m</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add Stops Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="secondary"
            onClick={handleAddStops}
            className="w-full h-12 bg-secondary hover:bg-muted text-foreground font-medium"
          >
            Add stops
          </Button>
        </motion.div>

        {/* Convoy Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Convoy with {tripState.convoy.length} friends
            </span>
            <button 
              onClick={() => navigate('/trip')}
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 text-primary" />
            </button>
          </div>

          {tripState.convoy.length > 0 && (
            <div className="space-y-2">
              {tripState.convoy.map(member => (
                <div 
                  key={member.id} 
                  className="flex items-center gap-3 p-3 bg-secondary rounded-xl"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{member.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Start Trip Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <Button
          onClick={handleStartTrip}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
        >
          Start trip
        </Button>
      </div>
    </div>
  );
};

export default TripReview;
