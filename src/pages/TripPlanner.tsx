import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Navigation, Clock, Car, Users, Plus, X, Search, 
  ChevronRight, AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockUsers, mockVehicles, formatDistance, formatDuration } from '@/lib/mock-data';

interface Stop {
  id: string;
  name: string;
}

const TripPlanner = () => {
  const navigate = useNavigate();
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedConvoy, setSelectedConvoy] = useState<string[]>([]);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  // Mock calculated values
  const estimatedDistance = destination ? 156 : 0;
  const estimatedDuration = destination ? 180 : 0;

  const addStop = () => {
    setStops([...stops, { id: Date.now().toString(), name: '' }]);
  };

  const removeStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id));
  };

  const updateStop = (id: string, name: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, name } : s));
  };

  const toggleConvoyMember = (userId: string) => {
    setSelectedConvoy(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const canStartTrip = (useCurrentLocation || startLocation) && destination && selectedVehicle;

  const handleStartTrip = () => {
    navigate('/trip/active');
  };

  return (
    <div className="flex flex-col bg-background safe-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-semibold text-foreground">Plan Trip</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Starting Location */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Starting Point
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setUseCurrentLocation(true)}
              className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                useCurrentLocation 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-card'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                useCurrentLocation ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {useCurrentLocation && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className="text-foreground">Use current location</span>
            </button>
            {!useCurrentLocation && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search starting location..."
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
            )}
            <button
              onClick={() => setUseCurrentLocation(false)}
              className="text-sm text-primary hover:underline"
            >
              {useCurrentLocation ? 'Or enter address manually' : 'Use current location instead'}
            </button>
          </div>
        </motion.section>

        {/* Destination */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            Destination
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Where are you heading?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
        </motion.section>

        {/* Stops */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-foreground">
            Stops (Optional)
          </label>
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div key={stop.id} className="relative flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    placeholder={`Stop ${index + 1}`}
                    value={stop.name}
                    onChange={(e) => updateStop(stop.id, e.target.value)}
                    className="pl-8 bg-card"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStop(stop.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addStop}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stop
            </Button>
          </div>
        </motion.section>

        {/* Vehicle Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Vehicle
          </label>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Select your vehicle" />
            </SelectTrigger>
            <SelectContent>
              {mockVehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.section>

        {/* Convoy Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Convoy (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {mockUsers.filter(u => u.id !== 'current').map(user => (
              <button
                key={user.id}
                onClick={() => toggleConvoyMember(user.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                  selectedConvoy.includes(user.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border'
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Trip Summary */}
        {destination && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <h3 className="font-semibold text-foreground mb-3">Trip Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-semibold text-foreground">{formatDistance(estimatedDistance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Est. Time</p>
                  <p className="font-semibold text-foreground">{formatDuration(estimatedDuration)}</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* Start Trip Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleStartTrip}
          disabled={!canStartTrip}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg disabled:opacity-50"
        >
          <Navigation className="h-5 w-5 mr-2" />
          Start Trip
        </Button>
      </div>
    </div>
  );
};

export default TripPlanner;
