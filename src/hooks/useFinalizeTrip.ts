import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import { useToast } from '@/hooks/use-toast';

interface FinalizeOptions {
  status: 'completed'; // Note: 'cancelled' is not a valid status per DB constraint
  title?: string;
  description?: string;
  mapImageUrl?: string;
  visibility?: string;
  isPublic?: boolean;
}

/**
 * Hook to reliably finalize (complete or cancel) a trip
 * Handles all backend cleanup including convoy members and active_trips
 */
export const useFinalizeTrip = () => {
  const { user } = useAuth();
  const { tripState, resetTrip } = useTrip();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get trip ID with fallback to backend lookup
  const resolveTripId = useCallback(async (): Promise<string | null> => {
    // Priority 1: Context trip ID
    if (tripState.activeTripId) {
      console.log('[useFinalizeTrip] Using context tripId:', tripState.activeTripId);
      return tripState.activeTripId;
    }

    // Priority 2: Fetch from backend
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
      console.error('[useFinalizeTrip] Error fetching active trip:', error);
      return null;
    }

    console.log('[useFinalizeTrip] Resolved from backend:', data?.id);
    return data?.id || null;
  }, [tripState.activeTripId, user?.id]);

  const finalizeTrip = useCallback(async (options: FinalizeOptions): Promise<boolean> => {
    const tripId = await resolveTripId();
    
    if (!tripId) {
      console.error('[useFinalizeTrip] No trip ID found to finalize');
      toast({
        title: "Error",
        description: "No active trip found to finalize",
        variant: "destructive",
      });
      return false;
    }

    console.log('[useFinalizeTrip] Finalizing trip:', tripId, 'with status:', options.status);

    try {
      // Update trip status
      const updateData: Record<string, unknown> = {
        status: options.status,
        completed_at: new Date().toISOString(),
      };

      if (options.title) updateData.title = options.title;
      if (options.description !== undefined) updateData.description = options.description;
      if (options.mapImageUrl) updateData.map_image_url = options.mapImageUrl;
      if (options.visibility) updateData.visibility = options.visibility;
      if (options.isPublic !== undefined) updateData.is_public = options.isPublic;

      const { error: tripError } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId);

      if (tripError) {
        console.error('[useFinalizeTrip] Failed to update trip:', tripError);
        toast({
          title: "Error",
          description: "Failed to finalize trip",
          variant: "destructive",
        });
        return false;
      }

      console.log('[useFinalizeTrip] Trip status updated successfully');

      // Update convoy members - the database trigger should handle this,
      // but we do it explicitly as backup
      const convoyStatus = options.status === 'completed' ? 'completed' : 'left';
      const { error: convoyError } = await supabase
        .from('convoy_members')
        .update({ status: convoyStatus })
        .eq('trip_id', tripId)
        .eq('status', 'active');

      if (convoyError) {
        console.error('[useFinalizeTrip] Failed to update convoy members:', convoyError);
      } else {
        console.log('[useFinalizeTrip] Convoy members updated');
      }

      // Delete active_trips entries
      const { error: activeTripsError } = await supabase
        .from('active_trips')
        .delete()
        .eq('trip_id', tripId);

      if (activeTripsError) {
        console.error('[useFinalizeTrip] Failed to delete active_trips:', activeTripsError);
      } else {
        console.log('[useFinalizeTrip] Active trips deleted');
      }

      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['active-convoy'] }),
        queryClient.invalidateQueries({ queryKey: ['active-trip'] }),
        queryClient.invalidateQueries({ queryKey: ['latest-active-trip'] }),
        queryClient.invalidateQueries({ queryKey: ['trips'] }),
        queryClient.invalidateQueries({ queryKey: ['feed-trips'] }),
      ]);

      console.log('[useFinalizeTrip] Queries invalidated');
      return true;
    } catch (error) {
      console.error('[useFinalizeTrip] Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  }, [resolveTripId, toast, queryClient]);

  const cancelTrip = useCallback(async (): Promise<boolean> => {
    // Use 'completed' status since 'cancelled' is not a valid status per DB constraint
    const success = await finalizeTrip({ status: 'completed' });
    if (success) {
      resetTrip();
    }
    return success;
  }, [finalizeTrip, resetTrip]);

  const completeTrip = useCallback(async (): Promise<boolean> => {
    return finalizeTrip({ status: 'completed' });
  }, [finalizeTrip]);

  return {
    finalizeTrip,
    cancelTrip,
    completeTrip,
    resolveTripId,
  };
};
