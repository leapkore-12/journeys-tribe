import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LikeWithProfile {
  id: string;
  user_id: string;
  trip_id: string;
  created_at: string | null;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useTripLikes = (tripId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['trip-likes', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_likes')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      const userIds = [...new Set(data.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return data.map(l => ({ ...l, profile: profileMap.get(l.user_id) || null })) as LikeWithProfile[];
    },
    enabled: enabled && !!tripId,
  });
};
