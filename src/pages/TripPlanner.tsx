import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Flag, Search, ChevronDown, Check, Plus, MapPin, Navigation, Loader2, Star, Crown, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TripHeader from '@/components/trip/TripHeader';
import LocationSearchInput from '@/components/trip/LocationSearchInput';
import RoutePreviewMap from '@/components/trip/RoutePreviewMap';
import { useTrip } from '@/context/TripContext';
import { useVehicles, VehicleWithImages } from '@/hooks/useVehicles';
import { useFollowing, useMutualFollowers } from '@/hooks/useFollows';
import { useTribe } from '@/hooks/useTribe';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMapboxGeocoding, GeocodingResult } from '@/hooks/useMapboxGeocoding';
import { useMapboxRoute } from '@/hooks/useMapboxRoute';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { User } from '@/lib/mock-data';

const TripPlanner = () => {
  const navigate = useNavigate();
  const { 
    tripState, setStep, setStartLocation, setDestination, 
    addStop, removeStop, setVehicle, toggleConvoyMember, setRouteInfo 
  } = useTrip();
  
  const [step, setLocalStep] = useState(tripState.step);
  const [startInput, setStartInput] = useState(tripState.startLocation || '');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(tripState.startCoordinates);
  const [destInput, setDestInput] = useState(tripState.destination);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(tripState.destinationCoordinates);
  const [stopInput, setStopInput] = useState('');
  const [stopCoords, setStopCoords] = useState<[number, number] | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithImages | null>(null);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [searchFriends, setSearchFriends] = useState('');
  const [localStops, setLocalStops] = useState(tripState.stops);
  const [selectedFriends, setSelectedFriends] = useState<string[]>(tripState.convoy.map(u => u.id));
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Real data hooks
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: following = [], isLoading: followingLoading } = useFollowing();
  const { data: tribe = [], isLoading: tribeLoading } = useTribe();
  const { getCurrentPosition, position: currentPosition } = useGeolocation({ enableHighAccuracy: true });
  const { reverseGeocode } = useMapboxGeocoding();
  const { route, getRoute, isLoading: routeLoading } = useMapboxRoute();
  const { canCreateConvoy } = useFeatureAccess();

  // Tab state for convoy selection
  const [convoyTab, setConvoyTab] = useState('tribe');

  // Create a set of tribe member IDs for quick lookup
  const tribeMemberIds = new Set(tribe.map(m => m.member_id));

  // Auto-select primary vehicle on mount
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      const primaryVehicle = vehicles.find(v => v.is_primary);
      if (primaryVehicle) {
        setSelectedVehicle(primaryVehicle);
      }
    }
  }, [vehicles, selectedVehicle]);

  // Convert following to User format for convoy with tribe flag and plan type
  const friends: (User & { isTribe: boolean; isPaid: boolean })[] = following.map(f => ({
    id: f.profile?.id || f.following_id,
    name: f.profile?.display_name || f.profile?.username || 'Unknown',
    username: f.profile?.username || '',
    avatar: f.profile?.avatar_url || '',
    bio: '',
    tripsCount: 0,
    followersCount: 0,
    followingCount: 0,
    vehiclesCount: 0,
    mutuals: [],
    isTribe: tribeMemberIds.has(f.following_id),
    isPaid: f.profile?.plan_type === 'paid',
  }));

  // Filter friends based on search and current tab
  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchFriends.toLowerCase())
  );

  const tribeFriends = filteredFriends.filter(f => f.isTribe);
  const allFollowing = filteredFriends;

  // Auto-detect current location on mount
  useEffect(() => {
    if (step === 1 && !startCoords) {
      handleGetCurrentLocation();
    }
  }, []);

  // Calculate route when we have start and destination
  useEffect(() => {
    if (startCoords && destCoords) {
      const waypoints = localStops
        .filter(s => s.coordinates)
        .map(s => s.coordinates as [number, number]);
      
      getRoute(startCoords, destCoords, waypoints.length > 0 ? waypoints : undefined);
    }
  }, [startCoords, destCoords, localStops, getRoute]);

  // Update trip context when route is calculated
  useEffect(() => {
    if (route) {
      setRouteInfo(
        route.distance / 1000, // Convert meters to km
        route.duration / 60, // Convert seconds to minutes
        route.coordinates
      );
    }
  }, [route, setRouteInfo]);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      await getCurrentPosition();
    } catch (err) {
      console.error('Failed to get location:', err);
    }
    setIsGettingLocation(false);
  };

  // Handle current position update
  useEffect(() => {
    if (currentPosition && isGettingLocation) {
      setStartCoords(currentPosition);
      reverseGeocode(currentPosition).then(result => {
        if (result) {
          setStartInput(result.address);
        } else {
          setStartInput('Current Location');
        }
        setIsGettingLocation(false);
      });
    }
  }, [currentPosition, reverseGeocode, isGettingLocation]);

  const handleStartSelect = (result: GeocodingResult) => {
    setStartInput(result.address);
    setStartCoords(result.coordinates);
  };

  const handleDestSelect = (result: GeocodingResult) => {
    setDestInput(result.address);
    setDestCoords(result.coordinates);
  };

  const handleStopSelect = (result: GeocodingResult) => {
    setStopInput(result.address);
    setStopCoords(result.coordinates);
  };

  const handleNext = () => {
    if (step === 1) {
      setStartLocation(startInput, startCoords || undefined);
      if (selectedVehicle) {
        setVehicle({
          id: selectedVehicle.id,
          name: selectedVehicle.name,
          make: selectedVehicle.make || '',
          model: selectedVehicle.model || '',
          year: selectedVehicle.year || 0,
          type: 'car',
          specs: '',
          images: selectedVehicle.vehicle_images?.map(i => i.image_url) || [],
        });
      }
      setLocalStep(2);
      setStep(2);
    } else if (step === 2) {
      setDestination(destInput, destInput, destCoords || undefined);
      setLocalStep(3);
      setStep(3);
    } else if (step === 3) {
      setLocalStep(4);
      setStep(4);
    } else if (step === 4) {
      navigate('/trip/review');
    }
  };

  const handleAddStop = () => {
    if (stopInput.trim()) {
      addStop(stopInput, stopCoords || undefined);
      setLocalStops([...localStops, { id: Date.now().toString(), address: stopInput, coordinates: stopCoords }]);
      setStopInput('');
      setStopCoords(null);
    }
  };

  const handleToggleFriend = (userId: string) => {
    const user = friends.find(u => u.id === userId);
    // Only allow toggling paid users
    if (user && user.isPaid) {
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
    if (step === 2) return destInput && destCoords;
    return true;
  };

  const getButtonText = () => {
    if (step === 4) return 'Review Trip';
    return 'Next';
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('/feed');
    } else {
      const prevStep = (step - 1) as 1 | 2 | 3 | 4;
      setLocalStep(prevStep);
      setStep(prevStep);
    }
  };

  const formatDistance = (km: number) => {
    return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Helper component for friend selection
  const FriendSelectItem = ({ 
    friend, 
    isSelected, 
    isTribe, 
    onToggle 
  }: { 
    friend: User & { isTribe: boolean; isPaid: boolean };
    isSelected: boolean;
    isTribe: boolean;
    onToggle: () => void;
  }) => {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors bg-secondary hover:bg-muted/50"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.avatar} alt={friend.name} />
          <AvatarFallback>{friend.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left flex items-center gap-2">
          <span className="text-foreground">{friend.name}</span>
          {isTribe && (
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <Checkbox 
          checked={isSelected}
          className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top">
      <TripHeader onBack={handleBack} />
      
      {/* Title */}
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-xl font-semibold text-primary text-center">Trip Planner</h1>
      </div>

      <div className="flex-1 px-4 pb-36 overflow-y-auto scrollbar-hide">
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
                <div className="flex gap-2">
                  <div className="flex-1">
                    <LocationSearchInput
                      value={startInput}
                      onChange={setStartInput}
                      onSelect={handleStartSelect}
                      placeholder="Enter start location"
                      icon={<Crosshair className="h-5 w-5" />}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="h-12 w-12 shrink-0"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Navigation className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {startCoords && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {startCoords[1].toFixed(4)}, {startCoords[0].toFixed(4)}
                  </p>
                )}
              </div>

              {/* Select vehicle */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Select vehicle</label>
                <div className="relative">
                  <button
                    onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                    className="w-full h-12 px-4 bg-secondary rounded-lg flex items-center justify-between text-left"
                  >
                    <span className={selectedVehicle ? 'text-foreground' : 'text-muted-foreground'}>
                      {selectedVehicle ? `🚗 ${selectedVehicle.name}` : vehiclesLoading ? 'Loading...' : 'Select vehicle'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-primary transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showVehicleDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded-lg border border-border overflow-hidden z-50 max-h-60 overflow-y-auto"
                    >
                      {vehicles.length === 0 ? (
                        <div className="px-4 py-3 text-center">
                          <p className="text-muted-foreground text-sm">No vehicles found</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate('/garage')}
                            className="text-primary"
                          >
                            Add a vehicle
                          </Button>
                        </div>
                      ) : (
                        vehicles.map(vehicle => (
                          <button
                            key={vehicle.id}
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowVehicleDropdown(false);
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-foreground">🚗 {vehicle.name}</span>
                              {vehicle.make && vehicle.model && (
                                <span className="text-muted-foreground text-sm">
                                  ({vehicle.make} {vehicle.model})
                                </span>
                              )}
                            </div>
                            {selectedVehicle?.id === vehicle.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </button>
                        ))
                      )}
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
                <LocationSearchInput
                  value={destInput}
                  onChange={setDestInput}
                  onSelect={handleDestSelect}
                  placeholder="Search for destination"
                  icon={<Flag className="h-5 w-5" />}
                />
                {destCoords && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {destCoords[1].toFixed(4)}, {destCoords[0].toFixed(4)}
                  </p>
                )}
              </div>

              {/* Route preview */}
              {startCoords && destCoords && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <RoutePreviewMap
                    startCoordinates={startCoords}
                    destinationCoordinates={destCoords}
                    routeCoordinates={route?.coordinates}
                    className="h-48"
                  />
                  
                  {routeLoading ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Calculating route...</span>
                    </div>
                  ) : route && (
                    <div className="flex items-center justify-center gap-4 p-3 bg-secondary rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-primary">
                          {formatDistance(route.distance / 1000)}
                        </p>
                        <p className="text-xs text-muted-foreground">Distance</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center">
                        <p className="text-lg font-semibold text-primary">
                          {formatDuration(route.duration / 60)}
                        </p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
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
                <label className="text-sm text-muted-foreground">Add stops (optional)</label>
                <div className="relative">
                  <LocationSearchInput
                    value={stopInput}
                    onChange={setStopInput}
                    onSelect={handleStopSelect}
                    placeholder="Search for a stop"
                    icon={<Flag className="h-5 w-5" />}
                    className="pr-12"
                  />
                  <button 
                    onClick={handleAddStop}
                    disabled={!stopInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary rounded-full disabled:opacity-50"
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
                      <div className="flex-1">
                        <span className="text-foreground">{stop.address}</span>
                        {stop.coordinates && (
                          <p className="text-xs text-muted-foreground">
                            {stop.coordinates[1].toFixed(4)}, {stop.coordinates[0].toFixed(4)}
                          </p>
                        )}
                      </div>
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

              {/* Route preview with stops */}
              {startCoords && destCoords && (
                <RoutePreviewMap
                  startCoordinates={startCoords}
                  destinationCoordinates={destCoords}
                  routeCoordinates={route?.coordinates}
                  className="h-40"
                />
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
              className="space-y-4"
            >
              {!canCreateConvoy ? (
                /* Free user - show upgrade prompt */
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Convoy is a Pro Feature
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upgrade to Pro to create convoys with live location sharing
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/settings')}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    Upgrade to Pro
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Skip this step to continue without a convoy
                  </p>
                </div>
              ) : (
                /* Paid user - show convoy selection */
                <>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Invite friends to convoy (optional)</label>
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

                  {/* Tabs for Tribe/Following */}
                  <Tabs value={convoyTab} onValueChange={setConvoyTab} className="w-full">
                    <TabsList className="w-full bg-secondary">
                      <TabsTrigger value="tribe" className="flex-1 gap-1">
                        <Star className="h-3 w-3" />
                        Tribe
                      </TabsTrigger>
                      <TabsTrigger value="following" className="flex-1">
                        Following
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tribe" className="mt-4 space-y-2">
                      {tribeLoading || followingLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : tribeFriends.length === 0 ? (
                        <div className="text-center py-8">
                          <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-muted-foreground">No tribe members yet</p>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            Add close friends to your tribe in Settings
                          </p>
                        </div>
                      ) : (
                        tribeFriends.map(friend => (
                          <FriendSelectItem
                            key={friend.id}
                            friend={friend}
                            isSelected={selectedFriends.includes(friend.id)}
                            isTribe={true}
                            onToggle={() => handleToggleFriend(friend.id)}
                          />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="following" className="mt-4 space-y-2">
                      {followingLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : allFollowing.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">You're not following anyone yet</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate('/search')}
                            className="text-primary"
                          >
                            Find people to follow
                          </Button>
                        </div>
                      ) : (
                        allFollowing.map(friend => (
                          <FriendSelectItem
                            key={friend.id}
                            friend={friend}
                            isSelected={selectedFriends.includes(friend.id)}
                            isTribe={friend.isTribe}
                            onToggle={() => handleToggleFriend(friend.id)}
                          />
                        ))
                      )}
                    </TabsContent>
                  </Tabs>

                  {selectedFriends.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected for convoy
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background">
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
