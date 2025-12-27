import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import { useActiveConvoy } from '@/hooks/useActiveConvoy';

/**
 * Hook to reliably resolve the active trip ID from multiple sources:
 * 1. TripContext.activeTripId (set when trip is created)
 * 2. ActiveConvoy.trip_id (for convoy members)
 * 3. Backend lookup (fetch latest active trip owned by user)
 */
export const useResolveActiveTripId = () => {
  const { user } = useAuth();
  const { tripState } = useTrip();
  const { data: activeConvoy } = useActiveConvoy();

  // Fetch the latest active trip from backend as fallback
  const { data: latestActiveTrip } = useQuery({
    queryKey: ['latest-active-trip', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('trips')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest active trip:', error);
        return null;
      }
      
      return data?.id || null;
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Resolved trip ID with priority order
  const resolvedTripId = useMemo(() => {
    // Priority 1: Context trip ID (set when trip was created)
    if (tripState.activeTripId) {
      console.log('[useResolveActiveTripId] Using context tripId:', tripState.activeTripId);
      return tripState.activeTripId;
    }
    
    // Priority 2: Active convoy trip ID (for convoy members)
    if (activeConvoy?.trip_id) {
      console.log('[useResolveActiveTripId] Using activeConvoy tripId:', activeConvoy.trip_id);
      return activeConvoy.trip_id;
    }
    
    // Priority 3: Latest active trip from backend
    if (latestActiveTrip) {
      console.log('[useResolveActiveTripId] Using backend tripId:', latestActiveTrip);
      return latestActiveTrip;
    }
    
    console.log('[useResolveActiveTripId] No trip ID found');
    return null;
  }, [tripState.activeTripId, activeConvoy?.trip_id, latestActiveTrip]);

  // Async function to get trip ID (for use in handlers where we need fresh data)
  const getTripId = useCallback(async (): Promise<string | null> => {
    // Priority 1: Context
    if (tripState.activeTripId) {
      return tripState.activeTripId;
    }
    
    // Priority 2: Active convoy
    if (activeConvoy?.trip_id) {
      return activeConvoy.trip_id;
    }
    
    // Priority 3: Fresh fetch from backend
    if (!user?.id) return null;
    
    const { data, error } = await supabase
      .from('trips')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[useResolveActiveTripId] Error fetching trip:', error);
      return null;
    }
    
    console.log('[useResolveActiveTripId] Fetched from backend:', data?.id);
    return data?.id || null;
  }, [tripState.activeTripId, activeConvoy?.trip_id, user?.id]);

  return {
    tripId: resolvedTripId,
    getTripId,
    isOwner: activeConvoy?.is_leader ?? true,
  };
};
