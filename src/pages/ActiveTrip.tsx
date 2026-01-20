import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Phone, ArrowUp, Mic, Compass,
  Search, X, AlertTriangle, LocateFixed, Route,
  Share2, Users, Pause, WifiOff, Loader2, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrip } from '@/context/TripContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMapboxRoute } from '@/hooks/useMapboxRoute';
import { useConvoyPresence, ConvoyMemberPresence } from '@/hooks/useConvoyPresence';
import { useConvoyInvites } from '@/hooks/useConvoyInvites';
import { useConvoyMembers, useTransferLeadership, useIsConvoyLeader, ConvoyMember } from '@/hooks/useConvoyMembers';
import { useOfflineTracking } from '@/hooks/useOfflineTracking';
import { useActiveTrip } from '@/hooks/useActiveTrip';
import { useActiveConvoy, ActiveConvoyTrip } from '@/hooks/useActiveConvoy';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LiveTrackingMap, { LiveTrackingMapRef } from '@/components/map/LiveTrackingMap';
import ConvoyPanel from '@/components/convoy/ConvoyPanel';
import ConvoyStatusBar from '@/components/convoy/ConvoyStatusBar';
import NearbySearchSheet from '@/components/trip/NearbySearchSheet';
import ReportHazardSheet from '@/components/trip/ReportHazardSheet';
import { useRoadHazards, RoadHazard } from '@/hooks/useRoadHazards';
import logoWhite from '@/assets/logo-white.svg';
import { calculateDistance } from '@/lib/distance-utils';

// Merged convoy member type: roster (database) + presence (realtime)
export interface MergedConvoyMember {
  id: string;
  name: string;
  avatar?: string;
  isLeader: boolean;
  // Presence data (if connected)
  isConnected: boolean;
  position?: [number, number];
  heading?: number;
  speed?: number;
  lastUpdate?: number;
  vehicleType?: 'car' | 'bike' | 'truck';
}

const ActiveTrip = () => {
  const navigate = useNavigate();
  const { tripState, pauseTrip, updateProgress, resetTrip } = useTrip();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSOS, setShowSOS] = useState(false);
  const [showConvoyPanel, setShowConvoyPanel] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(tripState.timeElapsed);
  const [distance, setDistance] = useState(tripState.distanceCovered);
  const [compassMode, setCompassMode] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [showNearbySearch, setShowNearbySearch] = useState(false);
  const [showReportHazard, setShowReportHazard] = useState(false);
  const watchIdRef = useRef<string | number | null>(null);
  const mapRef = useRef<LiveTrackingMapRef>(null);
  const prevPositionRef = useRef<[number, number] | null>(null);

  // Get active convoy trip from database (for convoy members who joined)
  const { data: activeConvoy, isLoading: isLoadingConvoy } = useActiveConvoy();

  // Determine the trip ID with proper priority order (context > convoy > backend)
  const activeTripId = useMemo(() => {
    if (tripState.activeTripId) {
      console.log('[ActiveTrip] Using context tripId:', tripState.activeTripId);
      return tripState.activeTripId;
    }
    if (activeConvoy?.trip_id) {
      console.log('[ActiveTrip] Using activeConvoy tripId:', activeConvoy.trip_id);
      return activeConvoy.trip_id;
    }
    console.log('[ActiveTrip] No trip ID available yet');
    return null;
  }, [tripState.activeTripId, activeConvoy?.trip_id]);

  // Determine if user is convoy leader
  const isLeader = activeConvoy?.is_leader ?? true;
  
  // Show loading if we don't have a trip ID yet
  const isResolvingTrip = !activeTripId && (isLoadingConvoy || !activeConvoy);

  // Track previous convoy state to detect trip completion
  const prevActiveConvoyRef = useRef<ActiveConvoyTrip | null | undefined>(undefined);

  // Detect when trip transitions from active to completed (for convoy members)
  useEffect(() => {
    if (prevActiveConvoyRef.current === undefined) {
      prevActiveConvoyRef.current = activeConvoy;
      return;
    }

    const wasActive = prevActiveConvoyRef.current?.trip?.status === 'active';
    const isNowCompleted = !activeConvoy || activeConvoy.trip?.status !== 'active';
    const wasConvoyMember = prevActiveConvoyRef.current && !prevActiveConvoyRef.current.is_leader;

    if (wasActive && isNowCompleted && wasConvoyMember) {
      console.log('[ActiveTrip] Convoy trip completed by leader, navigating member away');
      toast({
        title: '🏁 Trip completed!',
        description: 'The convoy leader has finished the trip',
      });
      resetTrip();
      navigate('/trip/complete');
    }

    prevActiveConvoyRef.current = activeConvoy;
  }, [activeConvoy, navigate, toast, resetTrip]);

  // Real-time subscription to convoy_members status changes (backup detection)
  useEffect(() => {
    if (!user?.id || !activeTripId || isLeader) return;

    console.log('[ActiveTrip] Setting up convoy member status subscription for user:', user.id);
    
    const channel = supabase
      .channel(`convoy-member-status-${user.id}-${activeTripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'convoy_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;
          const tripId = payload.new?.trip_id;
          
          console.log('[ActiveTrip] Convoy member status changed:', newStatus, 'for trip:', tripId);
          
          if ((newStatus === 'completed' || newStatus === 'left') && tripId === activeTripId) {
            toast({
              title: '🏁 Trip completed!',
              description: 'The convoy leader has finished the trip',
            });
            resetTrip();
            navigate('/trip/complete');
          }
        }
      )
      .subscribe((status) => {
        console.log('[ActiveTrip] Convoy member status subscription:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeTripId, isLeader, navigate, toast, resetTrip]);

  // Get destination coordinates from active convoy or trip state
  const destinationCoordinates = useMemo(() => {
    if (activeConvoy?.trip?.end_lat && activeConvoy?.trip?.end_lng) {
      return [activeConvoy.trip.end_lng, activeConvoy.trip.end_lat] as [number, number];
    }
    return tripState.destinationCoordinates;
  }, [activeConvoy, tripState.destinationCoordinates]);

  const destinationName = activeConvoy?.trip?.end_location || tripState.destination || 'Destination';

  // Real GPS tracking
  const { 
    position: userPosition, 
    heading,
    speed,
    startWatching, 
    stopWatching,
    getCurrentPosition,
    error: geoError 
  } = useGeolocation({ enableHighAccuracy: true });

  // Route fetching
  const { route, getRoute } = useMapboxRoute();

  // Offline tracking support - only enabled if we have a trip ID
  const {
    isOnline,
    isSyncing,
    bufferedCount,
    handlePositionUpdate,
    syncBufferedPoints,
  } = useOfflineTracking(activeTripId || undefined);

  // Active trip DB persistence
  const { updatePosition: updateTripPosition } = useActiveTrip();

  // Real-time convoy presence tracking (NO callbacks - presence events are too noisy)
  const { 
    members: convoyPresenceMembers, 
    activeMembers: activePresenceMembers,
    isConnected: isConvoyConnected,
    updatePosition,
    leaveConvoy,
  } = useConvoyPresence({ 
    tripId: activeTripId || undefined, 
    enabled: !!activeTripId && (tripState.isActive || !!activeConvoy) && isOnline,
  });

  // Convoy roster from database (the truth of who's in the convoy)
  const { data: convoyRoster = [] } = useConvoyMembers(activeTripId || undefined, {
    // Only show toast for DB-based membership changes (not presence)
    onMemberJoin: (member) => {
      // Only show toast if we're the leader and it's not us
      if (isLeader && member.user_id !== user?.id) {
        toast({
          title: '🎉 New rider joined!',
          description: `${member.profile?.display_name || member.profile?.username || 'A rider'} joined your convoy`,
        });
      }
    },
    onMemberLeave: (memberId) => {
      // Only notify about real membership leave (not presence disconnects)
      const member = convoyRoster.find(m => m.user_id === memberId);
      if (member && member.user_id !== user?.id) {
        toast({
          title: 'Rider left',
          description: `${member.profile?.display_name || member.profile?.username || 'A rider'} left the convoy`,
        });
      }
    },
  });

  // Find the leader from roster
  const leaderId = useMemo(() => {
    const leader = convoyRoster.find(m => m.is_leader);
    return leader?.user_id || user?.id;
  }, [convoyRoster, user?.id]);

  // Merge roster (database) with presence (realtime) for accurate display
  const mergedConvoyMembers = useMemo((): MergedConvoyMember[] => {
    // Start with roster members (excluding self)
    const mergedMap = new Map<string, MergedConvoyMember>();
    
    convoyRoster
      .filter(m => m.user_id !== user?.id && m.status === 'active')
      .forEach(m => {
        mergedMap.set(m.user_id, {
          id: m.user_id,
          name: m.profile?.display_name || m.profile?.username || 'Unknown',
          avatar: m.profile?.avatar_url || undefined,
          isLeader: m.is_leader,
          isConnected: false, // Will be updated from presence
        });
      });

    // Merge presence data
    convoyPresenceMembers.forEach(p => {
      const existing = mergedMap.get(p.id);
      if (existing) {
        // Update with presence data
        existing.isConnected = true;
        existing.position = p.position;
        existing.heading = p.heading;
        existing.speed = p.speed;
        existing.lastUpdate = p.lastUpdate;
        existing.vehicleType = p.vehicleType;
      } else {
        // Member has presence but not in roster yet (rare edge case)
        mergedMap.set(p.id, {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          isLeader: false,
          isConnected: true,
          position: p.position,
          heading: p.heading,
          speed: p.speed,
          lastUpdate: p.lastUpdate,
          vehicleType: p.vehicleType,
        });
      }
    });

    return Array.from(mergedMap.values());
  }, [convoyRoster, convoyPresenceMembers, user?.id]);

  // Connected members count (for UI)
  const connectedMembersCount = mergedConvoyMembers.filter(m => m.isConnected).length;
  const totalMembersCount = mergedConvoyMembers.length;

  // For the map, we only show members with live position data
  const mapConvoyMembers: ConvoyMemberPresence[] = useMemo(() => {
    return mergedConvoyMembers
      .filter(m => m.isConnected && m.position)
      .map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        position: m.position!,
        heading: m.heading,
        speed: m.speed,
        lastUpdate: m.lastUpdate || Date.now(),
        vehicleType: m.vehicleType,
      }));
  }, [mergedConvoyMembers]);

  // Debug convoy members
  useEffect(() => {
    console.log('[ActiveTrip] Merged convoy members:', mergedConvoyMembers.length, 
      'Connected:', connectedMembersCount, 'Total:', totalMembersCount);
  }, [mergedConvoyMembers, connectedMembersCount, totalMembersCount]);

  // Convoy invites
  const { createInvite, copyInviteLink, getShareLink } = useConvoyInvites();

  // Road hazards
  const { hazards } = useRoadHazards(activeTripId);

  // Update convoy position when user moves (handles online/offline)
  useEffect(() => {
    if (userPosition) {
      handlePositionUpdate(
        userPosition,
        heading,
        speed,
        // This callback is called when online
        () => {
          if (isConvoyConnected) {
            updatePosition(userPosition, heading, speed);
          }
        }
      );
    }
  }, [userPosition, heading, speed, isConvoyConnected, updatePosition, handlePositionUpdate]);

  // Auto-sync buffered points when back online
  useEffect(() => {
    if (isOnline && bufferedCount > 0) {
      syncBufferedPoints(async (points) => {
        const lastPoint = points[points.length - 1];
        if (lastPoint) {
          await updateTripPosition.mutateAsync({
            activeTripId,
            position: lastPoint.position,
            heading: lastPoint.heading,
            speed: lastPoint.speed,
          });
        }
      });
    }
  }, [isOnline, bufferedCount, syncBufferedPoints, updateTripPosition, activeTripId]);

  // Start GPS tracking on mount
  useEffect(() => {
    const initGPS = async () => {
      const id = await startWatching();
      if (id !== null) {
        watchIdRef.current = id;
      }
    };
    initGPS();
    
    return () => {
      if (watchIdRef.current !== null) {
        stopWatching(watchIdRef.current);
      }
    };
  }, [startWatching, stopWatching]);

  // Fetch route when we have position and destination
  useEffect(() => {
    if (userPosition && destinationCoordinates) {
      getRoute(userPosition, destinationCoordinates);
    }
  }, [userPosition, destinationCoordinates, getRoute]);

  // Track elapsed time only (not fake distance)
  useEffect(() => {
    if (tripState.isPaused) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        updateProgress(distance, newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tripState.isPaused, distance, updateProgress]);

  // Track real distance from GPS position changes
  useEffect(() => {
    if (!userPosition || tripState.isPaused) return;
    
    if (!prevPositionRef.current) {
      prevPositionRef.current = userPosition;
      return;
    }
    
    const [prevLng, prevLat] = prevPositionRef.current;
    const [currLng, currLat] = userPosition;
    
    const distanceMoved = calculateDistance(prevLat, prevLng, currLat, currLng);
    
    if (distanceMoved > 0.01) {
      setDistance(prev => prev + distanceMoved);
      prevPositionRef.current = userPosition;
    }
  }, [userPosition, tripState.isPaused]);

  const handlePauseTrip = useCallback(async () => {
    await leaveConvoy();
    pauseTrip();
    navigate('/trip/paused');
  }, [leaveConvoy, pauseTrip, navigate]);

  // Handle share invite
  const handleShareInvite = useCallback(async () => {
    try {
      const result = await createInvite.mutateAsync({ tripId: activeTripId });
      
      if (navigator.share) {
        await navigator.share({
          title: 'Join my convoy!',
          text: 'Join my road trip convoy on RoadTribe',
          url: getShareLink(result.invite_code),
        });
      } else {
        await copyInviteLink(result.invite_code);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [createInvite, copyInviteLink, getShareLink, activeTripId]);

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
          ref={mapRef}
          userPosition={userPosition}
          destination={destinationCoordinates || undefined}
          routeCoordinates={route?.coordinates || tripState.routeCoordinates || undefined}
          convoyMembers={mapConvoyMembers}
          hazards={hazards}
          heading={heading}
          compassMode={compassMode}
          showRoute={showRoute}
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
          
          <div className="flex items-center gap-2">
            {/* Share invite button */}
            <button 
              onClick={handleShareInvite}
              disabled={createInvite.isPending}
              className="w-10 h-10 flex items-center justify-center bg-card/80 backdrop-blur rounded-full"
            >
              <Share2 className="h-4 w-4 text-foreground" />
            </button>
            
            <button 
              onClick={() => setShowSOS(true)}
              className="w-10 h-10 flex items-center justify-center bg-primary rounded-full"
            >
              <Phone className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Offline Status Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-30"
          >
            <div className="bg-yellow-600 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <WifiOff className="h-4 w-4 text-white flex-shrink-0" />
              <span className="text-white text-sm font-medium flex-1">
                Offline - Recording continues
              </span>
              {bufferedCount > 0 && (
                <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {bufferedCount} points buffered
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syncing Status Banner */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-30"
          >
            <div className="bg-primary rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
              <span className="text-primary-foreground text-sm font-medium">
                Syncing {bufferedCount} location points...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direction Banner */}
      <div className={`absolute ${!isOnline || isSyncing ? 'top-32' : 'top-20'} left-4 right-4 z-10 transition-all`}>
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
        <button 
          onClick={() => {
            setCompassMode(prev => !prev);
            toast({
              title: compassMode ? 'North-up mode' : 'Heading mode',
              description: compassMode ? 'Map oriented to north' : 'Map oriented to your heading',
            });
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            compassMode ? 'bg-primary' : 'bg-card'
          }`}
        >
          <Compass className={`h-5 w-5 ${compassMode ? 'text-primary-foreground' : 'text-foreground'}`} />
        </button>
        <button 
          onClick={() => setShowNearbySearch(true)}
          className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg"
        >
          <Search className="h-5 w-5 text-foreground" />
        </button>
        <button 
          onClick={() => {
            setShowRoute(prev => !prev);
            toast({
              title: showRoute ? 'Route hidden' : 'Route visible',
              description: showRoute ? 'Route line hidden from map' : 'Route line shown on map',
            });
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative transition-colors ${
            showRoute ? 'bg-card' : 'bg-destructive'
          }`}
        >
          <Route className={`h-5 w-5 ${showRoute ? 'text-foreground' : 'text-destructive-foreground'}`} />
          {!showRoute && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
              <X className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </button>
        <button 
          onClick={() => setShowReportHazard(true)}
          className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg"
        >
          <AlertTriangle className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Re-centre Button and Convoy Status */}
      <div className="absolute left-4 bottom-56 z-10 space-y-2">
        {(isConvoyConnected && totalMembersCount > 0) || !isOnline ? (
          <ConvoyStatusBar
            connectedCount={connectedMembersCount}
            totalCount={totalMembersCount}
            isConnected={isConvoyConnected}
            isOnline={isOnline}
            bufferedCount={bufferedCount}
            onShareInvite={handleShareInvite}
          />
        ) : null}
        <button 
          onClick={() => mapRef.current?.recenter()}
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
            {/* Convoy button */}
            <button 
              onClick={() => setShowConvoyPanel(true)}
              className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center relative"
            >
              <Users className="h-5 w-5 text-foreground" />
              {totalMembersCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">{totalMembersCount}</span>
                </div>
              )}
            </button>
            <button 
              onClick={handlePauseTrip}
              className="px-4 py-2 bg-destructive rounded-full"
            >
              <span className="text-destructive-foreground font-medium">Pause</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Pause Trip Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background z-10">
        <Button
          onClick={handlePauseTrip}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg gap-2"
        >
          <Pause className="h-5 w-5" />
          Pause trip
        </Button>
      </div>

      {/* Convoy Panel Sheet */}
      <AnimatePresence>
        {showConvoyPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowConvoyPanel(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-card rounded-t-2xl border-t border-border/50">
                <div className="p-4 border-b border-border/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Convoy Members</h2>
                    <p className="text-xs text-muted-foreground">
                      {connectedMembersCount} connected / {totalMembersCount} total
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareInvite}
                    disabled={createInvite.isPending}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Invite
                  </Button>
                </div>
                <ConvoyPanel
                  members={mergedConvoyMembers}
                  userPosition={userPosition}
                  isExpanded={true}
                  onToggle={() => setShowConvoyPanel(false)}
                  onMemberClick={(member) => {
                    console.log('Clicked member:', member);
                  }}
                  tripId={activeTripId}
                  currentLeaderId={leaderId}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm border border-destructive"
            >
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
                  href="tel:112"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-destructive text-destructive-foreground rounded-lg font-semibold"
                >
                  <Phone className="h-5 w-5" />
                  Call Emergency (112)
                </a>
                <Button
                  variant="outline"
                  onClick={() => setShowSOS(false)}
                  className="w-full h-12"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nearby Search Sheet */}
      <NearbySearchSheet
        open={showNearbySearch}
        onOpenChange={setShowNearbySearch}
        userPosition={userPosition}
        onSelectPlace={(place) => {
          toast({
            title: 'Place selected',
            description: place.name.split(',')[0],
          });
        }}
      />

      {/* Report Hazard Sheet */}
      <ReportHazardSheet
        open={showReportHazard}
        onOpenChange={setShowReportHazard}
        userPosition={userPosition}
        tripId={activeTripId}
      />
    </div>
  );
};

export default ActiveTrip;
