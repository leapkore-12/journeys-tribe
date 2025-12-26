import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Trip = Tables<'trips'>;
export type TripPhoto = Tables<'trip_photos'>;

export interface ConvoyMemberProfile {
  user_id: string;
  is_leader: boolean;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

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
  convoy_members?: ConvoyMemberProfile[];
}

const PAGE_SIZE = 10;

export const useFeedTrips = () => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed-trips', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      // Get followed user IDs first
      let followedIds: string[] = [];
      if (user?.id) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        followedIds = follows?.map(f => f.following_id) || [];
      }

      // Fetch trips - RLS handles visibility filtering via can_view_trip function
      // The DB function checks: public, followers (if following), tribe (if in tribe), private (owner only)
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*, trip_photos(*)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error || !trips) {
        console.error('Error fetching feed trips:', error);
        return { trips: [], nextPage: null };
      }

      // Fetch profiles for all trip owners
      const userIds = [...new Set(trips.map(t => t.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds)
        : { data: [] };
      const profileMap = new Map<string, { id: string; username: string | null; display_name: string | null; avatar_url: string | null }>();
      profiles?.forEach(p => profileMap.set(p.id, p));

      // Fetch vehicles
      const vehicleIds = [...new Set(trips.map(t => t.vehicle_id).filter((id): id is string => id !== null))];
      const { data: vehicles } = vehicleIds.length > 0 
        ? await supabase.from('vehicles').select('*, vehicle_images(image_url)').in('id', vehicleIds)
        : { data: [] };
      
      type VehicleType = { id: string; name: string; make: string | null; model: string | null; images: string[] };
      const vehicleMap = new Map<string, VehicleType>();
      vehicles?.forEach(v => vehicleMap.set(v.id, { 
        id: v.id, 
        name: v.name, 
        make: v.make, 
        model: v.model, 
        images: (v.vehicle_images as { image_url: string }[] | null)?.map(vi => vi.image_url) || [] 
      }));

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

      // Fetch convoy members for all trips
      const tripIds = trips.map(t => t.id);
      const { data: convoyMembers } = tripIds.length > 0
        ? await supabase
            .from('convoy_members')
            .select('trip_id, user_id, is_leader')
            .in('trip_id', tripIds)
            .eq('status', 'active')
        : { data: [] };

      // Get profiles for convoy members (excluding trip owners to avoid duplicates)
      const convoyUserIds = [...new Set(convoyMembers?.map(cm => cm.user_id).filter(id => !profileMap.has(id)) || [])];
      const { data: convoyProfiles } = convoyUserIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', convoyUserIds)
        : { data: [] };
      convoyProfiles?.forEach(p => profileMap.set(p.id, { ...p, username: null }));

      // Group convoy members by trip_id
      const convoyMemberMap = new Map<string, ConvoyMemberProfile[]>();
      convoyMembers?.forEach(cm => {
        const profile = profileMap.get(cm.user_id);
        const member: ConvoyMemberProfile = {
          user_id: cm.user_id,
          is_leader: cm.is_leader || false,
          profile: profile ? { id: profile.id, display_name: profile.display_name, avatar_url: profile.avatar_url } : null,
        };
        if (!convoyMemberMap.has(cm.trip_id)) {
          convoyMemberMap.set(cm.trip_id, []);
        }
        convoyMemberMap.get(cm.trip_id)!.push(member);
      });

      const tripsWithDetails: TripWithDetails[] = trips.map(trip => ({
        ...trip,
        profile: profileMap.get(trip.user_id) || null,
        vehicle: trip.vehicle_id ? vehicleMap.get(trip.vehicle_id) : null,
        is_liked: likedIds.has(trip.id),
        convoy_members: convoyMemberMap.get(trip.id)?.filter(cm => cm.user_id !== trip.user_id) || [],
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
      const vehicleIds = [...new Set(trips.map(t => t.vehicle_id).filter((id): id is string => id !== null))];
      const { data: vehicles } = vehicleIds.length > 0 
        ? await supabase.from('vehicles').select('*, vehicle_images(image_url)').in('id', vehicleIds)
        : { data: [] };
      
      type VehicleType = { id: string; name: string; make: string | null; model: string | null; images: string[] };
      const vehicleMap = new Map<string, VehicleType>();
      vehicles?.forEach(v => vehicleMap.set(v.id, { 
        id: v.id, 
        name: v.name, 
        make: v.make, 
        model: v.model, 
        images: (v.vehicle_images as { image_url: string }[] | null)?.map(vi => vi.image_url) || [] 
      }));

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
        // Unlike - database trigger handles notification deletion
        const { error } = await supabase.from('trip_likes').delete().eq('trip_id', tripId).eq('user_id', user.id);
        if (error) throw new Error('Failed to unlike: ' + error.message);
      } else {
        // Like - database trigger handles notification creation
        const { error } = await supabase.from('trip_likes').insert({ trip_id: tripId, user_id: user.id });
        if (error) throw new Error('Failed to like: ' + error.message);
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

export const useTripById = (tripId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;

      // Fetch trip with photos
      const { data: trip, error } = await supabase
        .from('trips')
        .select('*, trip_photos(*)')
        .eq('id', tripId)
        .maybeSingle();

      if (error || !trip) return null;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', trip.user_id)
        .maybeSingle();

      // Fetch vehicle with images (sorted by is_primary)
      let vehicle = null;
      if (trip.vehicle_id) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('*, vehicle_images(image_url, is_primary)')
          .eq('id', trip.vehicle_id)
          .maybeSingle();
        
        if (vehicleData) {
          // Sort images so primary comes first
          const sortedImages = (vehicleData.vehicle_images as { image_url: string; is_primary: boolean | null }[] | null)
            ?.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
            .map(vi => vi.image_url) || [];
          
          vehicle = {
            id: vehicleData.id,
            name: vehicleData.name,
            make: vehicleData.make,
            model: vehicleData.model,
            images: sortedImages
          };
        }
      }

      // Check if liked
      let isLiked = false;
      if (user?.id) {
        const { data: like } = await supabase
          .from('trip_likes')
          .select('id')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .maybeSingle();
        isLiked = !!like;
      }

      // Fetch convoy members
      const { data: convoyMembers } = await supabase
        .from('convoy_members')
        .select('user_id, is_leader')
        .eq('trip_id', tripId)
        .eq('status', 'active');

      // Fetch profiles for convoy members
      const convoyUserIds = convoyMembers?.map(cm => cm.user_id).filter(id => id !== trip.user_id) || [];
      const { data: convoyProfiles } = convoyUserIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', convoyUserIds)
        : { data: [] };
      
      const profileMap = new Map<string, { id: string; display_name: string | null; avatar_url: string | null }>();
      convoyProfiles?.forEach(p => profileMap.set(p.id, p));

      const convoyMembersWithProfiles: ConvoyMemberProfile[] = convoyMembers
        ?.filter(cm => cm.user_id !== trip.user_id)
        .map(cm => ({
          user_id: cm.user_id,
          is_leader: cm.is_leader || false,
          profile: profileMap.get(cm.user_id) || null,
        })) || [];

      return { ...trip, profile, vehicle, is_liked: isLiked, convoy_members: convoyMembersWithProfiles } as TripWithDetails;
    },
    enabled: !!tripId,
  });
};

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, updates }: { tripId: string; updates: TablesUpdate<'trips'> }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['feed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
};
