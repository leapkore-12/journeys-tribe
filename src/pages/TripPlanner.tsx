import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Flag, Search, ChevronDown, Check, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import TripHeader from '@/components/trip/TripHeader';
import { mockUsers, mockVehicles, Vehicle } from '@/lib/mock-data';
import { useTrip } from '@/context/TripContext';

const TripPlanner = () => {
  const navigate = useNavigate();
  const { tripState, setStep, setStartLocation, setDestination, addStop, removeStop, setVehicle, toggleConvoyMember } = useTrip();
  const [step, setLocalStep] = useState(tripState.step);
  const [startInput, setStartInput] = useState(tripState.startLocation || 'Your location');
  const [destInput, setDestInput] = useState(tripState.destination);
  const [stopInput, setStopInput] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(tripState.vehicle);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [searchFriends, setSearchFriends] = useState('');
  const [localStops, setLocalStops] = useState(tripState.stops);
  const [selectedFriends, setSelectedFriends] = useState<string[]>(tripState.convoy.map(u => u.id));

  const friends = mockUsers.filter(u => u.id !== 'current');
  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchFriends.toLowerCase())
  );

  const handleNext = () => {
    if (step === 1) {
      setStartLocation(startInput);
      setVehicle(selectedVehicle);
      setLocalStep(2);
      setStep(2);
    } else if (step === 2) {
      setDestination(destInput, destInput);
      setLocalStep(3);
      setStep(3);
    } else if (step === 3) {
      setLocalStep(4);
      setStep(4);
    } else if (step === 4) {
      // Navigate to review
      navigate('/trip/review');
    }
  };

  const handleAddStop = () => {
    if (stopInput.trim()) {
      addStop(stopInput);
      setLocalStops([...localStops, { id: Date.now().toString(), address: stopInput }]);
      setStopInput('');
    }
  };

  const handleToggleFriend = (userId: string) => {
    const user = friends.find(u => u.id === userId);
    if (user) {
      toggleConvoyMember(user);
      setSelectedFriends(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const canProceed = () => {
    if (step === 1) return startInput && selectedVehicle;
    if (step === 2) return destInput;
    return true;
  };

  const getButtonText = () => {
    if (step === 4) return 'Invite';
    return 'Finished';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top">
      <TripHeader backTo="/feed" />
      
      {/* Title */}
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-xl font-semibold text-primary text-center">Trip Planner</h1>
      </div>

      <div className="flex-1 px-4 pb-24">
        <AnimatePresence mode="wait">
          {/* Step 1: Start Point & Vehicle */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Add start point */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Add start point</label>
                <div className="relative">
                  <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={startInput}
                    onChange={(e) => setStartInput(e.target.value)}
                    placeholder="Your location"
                    className="pl-11 h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Select vehicle */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Select vehicle</label>
                <div className="relative">
                  <button
                    onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                    className="w-full h-12 px-4 bg-secondary rounded-lg flex items-center justify-between text-left"
                  >
                    <span className={selectedVehicle ? 'text-foreground' : 'text-primary'}>
                      {selectedVehicle ? `🚗 ${selectedVehicle.name}` : 'Select'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-primary transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showVehicleDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded-lg border border-border overflow-hidden z-50"
                    >
                      {mockVehicles.map(vehicle => (
                        <button
                          key={vehicle.id}
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowVehicleDropdown(false);
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-foreground">🚗 {vehicle.name}</span>
                          {selectedVehicle?.id === vehicle.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Add Destination */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Add destination</label>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={destInput}
                    onChange={(e) => setDestInput(e.target.value)}
                    placeholder="Enter the address"
                    className="pl-11 h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Add Stops */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Add stops</label>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={stopInput}
                    onChange={(e) => setStopInput(e.target.value)}
                    placeholder="Enter the address"
                    className="pl-11 pr-12 h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStop()}
                  />
                  <button 
                    onClick={handleAddStop}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary rounded-full"
                  >
                    <Plus className="h-4 w-4 text-primary-foreground" />
                  </button>
                </div>
              </div>

              {/* List of added stops */}
              {localStops.length > 0 && (
                <div className="space-y-2">
                  {localStops.map((stop, idx) => (
                    <div key={stop.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                      <span className="text-muted-foreground text-sm">{idx + 1}.</span>
                      <span className="text-foreground flex-1">{stop.address}</span>
                      <button 
                        onClick={() => {
                          removeStop(stop.id);
                          setLocalStops(localStops.filter(s => s.id !== stop.id));
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Invite Friends */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Invite your friends to convoy</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={searchFriends}
                    onChange={(e) => setSearchFriends(e.target.value)}
                    placeholder="Search for your friends"
                    className="pl-11 h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Friends list */}
              <div className="space-y-2">
                {filteredFriends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => handleToggleFriend(friend.id)}
                    className="w-full flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar} alt={friend.name} />
                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-foreground flex-1 text-left">{friend.name}</span>
                    <Checkbox 
                      checked={selectedFriends.includes(friend.id)}
                      className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg disabled:opacity-50"
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};

export default TripPlanner;
