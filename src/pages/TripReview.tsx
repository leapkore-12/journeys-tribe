import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crosshair, Flag, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/context/TripContext';
import { Search, Bell } from 'lucide-react';
import logoWhite from '@/assets/logo-white.svg';
import { useConvoyInvites } from '@/hooks/useConvoyInvites';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FixedBottomActions from '@/components/layout/FixedBottomActions';
import { OfflineMapDownload } from '@/components/trip/OfflineMapDownload';
const TripReview = () => {
  const navigate = useNavigate();
  const { tripState, startTrip, resetTrip, setActiveTripId } = useTrip();
  const { createBulkInvites } = useConvoyInvites();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartTrip = async () => {
    if (!user) return;
    
    setIsStarting(true);
    try {
      // Check for existing active trips and complete them first
      const { data: existingTrip } = await supabase
        .from('trips')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingTrip) {
        console.log('Found existing active trip, completing it:', existingTrip.id);
        
        // Complete the old trip
        await supabase
          .from('trips')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', existingTrip.id);
        
        // Deactivate convoy members of old trip
        await supabase
          .from('convoy_members')
          .update({ status: 'left' })
          .eq('trip_id', existingTrip.id)
          .eq('status', 'active');
        
        // Delete any active_trips entries for the old trip
        await supabase
          .from('active_trips')
          .delete()
          .eq('trip_id', existingTrip.id);
      }

      // Now create the new trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: `Trip to ${tripState.destination || 'Destination'}`,
          start_location: tripState.startLocation,
          start_lat: tripState.startCoordinates?.[1],
          start_lng: tripState.startCoordinates?.[0],
          end_location: tripState.destination,
          end_lat: tripState.destinationCoordinates?.[1],
          end_lng: tripState.destinationCoordinates?.[0],
          distance_km: tripState.routeDistance,
          duration_minutes: tripState.routeDuration ? Math.round(tripState.routeDuration) : null,
          vehicle_id: tripState.vehicle?.id,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (tripError || !trip) {
        console.error('Failed to create trip:', tripError);
        if (tripError?.code === '23505') {
          toast({
            title: 'Trip already in progress',
            description: 'Please complete or cancel your current trip first.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to create trip');
      }
      
      const tripId = trip.id;
      
      // Store the trip ID in context for later use when finishing the trip
      setActiveTripId(tripId);
      
      // Add the current user as convoy leader
      const { error: leaderError } = await supabase
        .from('convoy_members')
        .insert({
          trip_id: tripId,
          user_id: user.id,
          is_leader: true,
          status: 'active',
        });
      
      if (leaderError) {
        console.error('Failed to add leader:', leaderError);
      }
      
      // Create invites for selected convoy members
      if (tripState.convoy.length > 0) {
        const inviteeIds = tripState.convoy.map(member => member.id);
        await createBulkInvites.mutateAsync({ tripId, inviteeIds });
        
        toast({
          title: 'Convoy invites sent!',
          description: `Invited ${tripState.convoy.length} friends to join your convoy.`,
        });
      }
      
      startTrip();
      navigate('/trip/active');
    } catch (error) {
      console.error('Failed to start trip:', error);
      toast({
        title: 'Failed to start trip',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleAddStops = () => {
    navigate('/trip');
  };

  return (
    <div className="flex flex-col h-full bg-background">
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

      <div className="flex-1 overflow-y-auto px-4 pb-48 space-y-4 scrollbar-hide">
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
                <p className="text-foreground font-medium">{tripState.destination || 'Destination'}</p>
                <p className="text-sm text-muted-foreground mt-1">{tripState.destinationAddress}</p>
                {tripState.routeDistance && tripState.routeDuration && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {tripState.routeDistance.toFixed(1)} km • {Math.floor(tripState.routeDuration / 60)}h {Math.round(tripState.routeDuration % 60)}m
                  </p>
                )}
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

        {/* Offline Maps Download */}
        {tripState.routeCoordinates && tripState.routeCoordinates.length > 0 && (
          <OfflineMapDownload
            routeCoordinates={tripState.routeCoordinates}
            routeDistanceKm={tripState.routeDistance ? Math.round(tripState.routeDistance) : undefined}
          />
        )}
      </div>

      {/* Bottom Buttons */}
      <FixedBottomActions className="space-y-3">
        <Button
          variant="outline"
          onClick={() => {
            resetTrip();
            navigate('/trip');
          }}
          className="w-full h-12 border-primary text-primary hover:bg-primary/10 font-medium"
        >
          Cancel Trip
        </Button>
        <Button
          onClick={handleStartTrip}
          disabled={isStarting}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg gap-2"
        >
          {isStarting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting...
            </>
          ) : (
            'Start trip'
          )}
        </Button>
      </FixedBottomActions>
    </div>
  );
};

export default TripReview;
