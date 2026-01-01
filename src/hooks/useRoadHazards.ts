import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoadHazard {
  id: string;
  trip_id: string | null;
  reporter_id: string;
  hazard_type: string;
  latitude: number;
  longitude: number;
  description: string | null;
  created_at: string;
  expires_at: string;
}

export const useRoadHazards = (tripId: string | null) => {
  const [hazards, setHazards] = useState<RoadHazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setHazards([]);
      setIsLoading(false);
      return;
    }

    const fetchHazards = async () => {
      const { data, error } = await supabase
        .from('road_hazards')
        .select('*')
        .eq('trip_id', tripId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching hazards:', error);
      } else {
        setHazards(data || []);
      }
      setIsLoading(false);
    };

    fetchHazards();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`hazards-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'road_hazards',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHazards((prev) => [...prev, payload.new as RoadHazard]);
          } else if (payload.eventType === 'DELETE') {
            setHazards((prev) => prev.filter((h) => h.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { hazards, isLoading };
};
