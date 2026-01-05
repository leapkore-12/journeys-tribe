import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['search-users', query, user?.id],
    queryFn: async () => {
      if (!query.trim()) return [];

      // Get blocked user IDs
      let blockedIds: string[] = [];
      if (user?.id) {
        const { data: blocked } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        blockedIds = blocked?.map(b => b.blocked_id) || [];
      }

      const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url').or(`display_name.ilike.%${query}%,username.ilike.%${query}%`).limit(20);
      
      // Filter out blocked users
      return (data || []).filter(u => !blockedIds.includes(u.id)) as SearchProfile[];
    },
    enabled: query.length > 0,
  });
};

export const useSearchTrips = (query: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['search-trips', query, user?.id],
    queryFn: async () => {
      if (!query.trim()) return [];

      // Get blocked user IDs
      let blockedIds: string[] = [];
      if (user?.id) {
        const { data: blocked } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        blockedIds = blocked?.map(b => b.blocked_id) || [];
      }

      const { data: trips } = await supabase.from('trips').select('id, title, start_location, end_location, map_image_url, user_id').eq('is_public', true).eq('status', 'completed').or(`title.ilike.%${query}%,start_location.ilike.%${query}%,end_location.ilike.%${query}%`).limit(20);
      if (!trips) return [];

      // Filter out trips from blocked users
      const filteredTrips = trips.filter(t => !blockedIds.includes(t.user_id));

      const userIds = [...new Set(filteredTrips.map(t => t.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds)
        : { data: [] };
      const profileMap = new Map<string, SearchProfile>();
      profiles?.forEach(p => profileMap.set(p.id, p));

      const tripIds = filteredTrips.map(t => t.id);
      const { data: photos } = tripIds.length > 0
        ? await supabase.from('trip_photos').select('trip_id, image_url').in('trip_id', tripIds)
        : { data: [] };
      const photoMap = new Map<string, string>();
      photos?.forEach(p => photoMap.set(p.trip_id, p.image_url));

      return filteredTrips.map(t => ({ ...t, profile: profileMap.get(t.user_id) || null, image: photoMap.get(t.id) || t.map_image_url })) as SearchTrip[];
    },
    enabled: query.length > 0,
  });
};
