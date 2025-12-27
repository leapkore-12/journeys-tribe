import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ActiveConvoyTrip {
  trip_id: string;
  is_leader: boolean;
  trip: {
    id: string;
    title: string;
    start_location: string | null;
    end_location: string | null;
    status: string | null;
    start_lat: number | null;
    start_lng: number | null;
    end_lat: number | null;
    end_lng: number | null;
    user_id: string;
  };
}

export const useActiveConvoy = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['active-convoy', user?.id],
    queryFn: async (): Promise<ActiveConvoyTrip | null> => {
      if (!user?.id) return null;

      // Query convoy_members where user is part of an active trip
      const { data, error } = await supabase
        .from('convoy_members')
        .select(`
          trip_id,
          is_leader,
          trip:trips!inner(
            id,
            title,
            start_location,
            end_location,
            status,
            start_lat,
            start_lng,
            end_lat,
            end_lng,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching active convoy:', error);
        return null;
      }

      if (!data || !data.trip) return null;

      // Check if the trip is still active
      const trip = data.trip as ActiveConvoyTrip['trip'];
      if (trip.status !== 'active') return null;

      return {
        trip_id: data.trip_id,
        is_leader: data.is_leader ?? false,
        trip,
      };
    },
    enabled: !!user?.id,
    staleTime: 0, // Always consider data stale
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Subscribe to trip status changes for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to trips table changes
    const channel = supabase
      .channel('active-convoy-trips')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          const newStatus = payload.new?.status;
          // If any trip becomes completed or cancelled, invalidate the query
          if (newStatus === 'completed' || newStatus === 'cancelled') {
            queryClient.invalidateQueries({ queryKey: ['active-convoy', user.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'convoy_members',
        },
        () => {
          // Invalidate on any convoy member changes
          queryClient.invalidateQueries({ queryKey: ['active-convoy', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};
