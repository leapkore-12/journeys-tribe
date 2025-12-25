import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ActiveTripData {
  id: string;
  trip_id: string;
  user_id: string;
  status: 'active' | 'paused' | 'completed';
  last_position: {
    lng: number;
    lat: number;
    heading?: number;
    speed?: number;
    timestamp: number;
  } | null;
  started_at: string;
  paused_at: string | null;
}

interface StartTripParams {
  tripId: string;
  position?: [number, number];
}

interface UpdatePositionParams {
  activeTripId: string;
  position: [number, number];
  heading?: number;
  speed?: number;
}

export const useActiveTrip = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current active trip for user
  const { data: activeTrip, isLoading: isLoadingActive } = useQuery({
    queryKey: ['active-trip', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('active_trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        status: data.status as 'active' | 'paused' | 'completed',
        last_position: data.last_position as ActiveTripData['last_position'],
      };
    },
    enabled: !!user,
  });

  // Start a new active trip
  const startTrip = useMutation({
    mutationFn: async ({ tripId, position }: StartTripParams) => {
      if (!user) throw new Error('Not authenticated');

      const lastPosition = position ? {
        lng: position[0],
        lat: position[1],
        timestamp: Date.now(),
      } : null;

      const { data, error } = await supabase
        .from('active_trips')
        .insert({
          trip_id: tripId,
          user_id: user.id,
          status: 'active',
          last_position: lastPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        status: data.status as 'active' | 'paused' | 'completed',
        last_position: data.last_position as ActiveTripData['last_position'],
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip', user?.id] });
    },
  });

  // Update position in active trip
  const updatePosition = useMutation({
    mutationFn: async ({ activeTripId, position, heading, speed }: UpdatePositionParams) => {
      const lastPosition = {
        lng: position[0],
        lat: position[1],
        heading,
        speed,
        timestamp: Date.now(),
      };

      const { error } = await supabase
        .from('active_trips')
        .update({ last_position: lastPosition })
        .eq('id', activeTripId);

      if (error) throw error;
    },
  });

  // Pause trip
  const pauseTrip = useMutation({
    mutationFn: async (activeTripId: string) => {
      const { error } = await supabase
        .from('active_trips')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
        })
        .eq('id', activeTripId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip', user?.id] });
    },
  });

  // Resume trip
  const resumeTrip = useMutation({
    mutationFn: async (activeTripId: string) => {
      const { error } = await supabase
        .from('active_trips')
        .update({
          status: 'active',
          paused_at: null,
        })
        .eq('id', activeTripId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip', user?.id] });
    },
  });

  // Complete trip
  const completeTrip = useMutation({
    mutationFn: async (activeTripId: string) => {
      const { error } = await supabase
        .from('active_trips')
        .update({ status: 'completed' })
        .eq('id', activeTripId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip', user?.id] });
    },
  });

  return {
    activeTrip,
    isLoadingActive,
    startTrip,
    updatePosition,
    pauseTrip,
    resumeTrip,
    completeTrip,
  };
};
