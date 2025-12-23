import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface SearchTrip {
  id: string;
  title: string;
  start_location: string | null;
  end_location: string | null;
  map_image_url: string | null;
  profile?: SearchProfile | null;
  image?: string | null;
}

export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: ['search-users', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url').or(`display_name.ilike.%${query}%,username.ilike.%${query}%`).limit(20);
      return (data || []) as SearchProfile[];
    },
    enabled: query.length > 0,
  });
};

export const useSearchTrips = (query: string) => {
  return useQuery({
    queryKey: ['search-trips', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data: trips } = await supabase.from('trips').select('id, title, start_location, end_location, map_image_url, user_id').eq('is_public', true).eq('status', 'completed').or(`title.ilike.%${query}%,start_location.ilike.%${query}%,end_location.ilike.%${query}%`).limit(20);
      if (!trips) return [];

      const userIds = [...new Set(trips.map(t => t.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const tripIds = trips.map(t => t.id);
      const { data: photos } = await supabase.from('trip_photos').select('trip_id, image_url').in('trip_id', tripIds);
      const photoMap = new Map(photos?.map(p => [p.trip_id, p.image_url]) || []);

      return trips.map(t => ({ ...t, profile: profileMap.get(t.user_id) || null, image: photoMap.get(t.id) || t.map_image_url })) as SearchTrip[];
    },
    enabled: query.length > 0,
  });
};
