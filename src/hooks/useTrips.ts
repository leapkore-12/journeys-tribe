import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Trip = Tables<'trips'>;
export type TripPhoto = Tables<'trip_photos'>;

export interface TripWithDetails extends Trip {
  trip_photos: TripPhoto[];
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  vehicle?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    images: string[];
  } | null;
  is_liked?: boolean;
}

const PAGE_SIZE = 10;

export const useFeedTrips = () => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed-trips'],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch trips
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*, trip_photos(*)')
        .eq('status', 'completed')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error || !trips) {
        console.error('Error fetching feed trips:', error);
        return { trips: [], nextPage: null };
      }

      // Fetch profiles for all trip owners
      const userIds = [...new Set(trips.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch vehicles
      const vehicleIds = [...new Set(trips.map(t => t.vehicle_id).filter(Boolean))];
      const { data: vehicles } = vehicleIds.length > 0 
        ? await supabase.from('vehicles').select('*, vehicle_images(image_url)').in('id', vehicleIds)
        : { data: [] };
      const vehicleMap = new Map(vehicles?.map(v => [v.id, { ...v, images: v.vehicle_images?.map((vi: any) => vi.image_url) || [] }]) || []);

      // Check likes
      let likedIds = new Set<string>();
      if (user?.id) {
        const { data: likes } = await supabase
          .from('trip_likes')
          .select('trip_id')
          .eq('user_id', user.id)
          .in('trip_id', trips.map(t => t.id));
        likedIds = new Set(likes?.map(l => l.trip_id) || []);
      }

      const tripsWithDetails: TripWithDetails[] = trips.map(trip => ({
        ...trip,
        profile: profileMap.get(trip.user_id) || null,
        vehicle: trip.vehicle_id ? vehicleMap.get(trip.vehicle_id) : null,
        is_liked: likedIds.has(trip.id),
      }));

      return {
        trips: tripsWithDetails,
        nextPage: trips.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};

export const useUserTrips = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['user-trips', targetId],
    queryFn: async () => {
      if (!targetId) return [];

      const { data: trips, error } = await supabase
        .from('trips')
        .select('*, trip_photos(*)')
        .eq('user_id', targetId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error || !trips) return [];

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', targetId)
        .single();

      // Fetch vehicles
      const vehicleIds = [...new Set(trips.map(t => t.vehicle_id).filter(Boolean))];
      const { data: vehicles } = vehicleIds.length > 0 
        ? await supabase.from('vehicles').select('*, vehicle_images(image_url)').in('id', vehicleIds)
        : { data: [] };
      const vehicleMap = new Map(vehicles?.map(v => [v.id, { ...v, images: v.vehicle_images?.map((vi: any) => vi.image_url) || [] }]) || []);

      return trips.map(trip => ({
        ...trip,
        profile,
        vehicle: trip.vehicle_id ? vehicleMap.get(trip.vehicle_id) : null,
      })) as TripWithDetails[];
    },
    enabled: !!targetId,
  });
};

export const useLikeTrip = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tripId, isLiked }: { tripId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isLiked) {
        await supabase.from('trip_likes').delete().eq('trip_id', tripId).eq('user_id', user.id);
      } else {
        await supabase.from('trip_likes').insert({ trip_id: tripId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (trip: Omit<TablesInsert<'trips'>, 'user_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('trips').insert({ ...trip, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
};
