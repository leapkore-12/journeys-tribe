import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ConvoyMember {
  id: string;
  user_id: string;
  trip_id: string;
  is_leader: boolean;
  joined_at: string | null;
  status: string | null;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useConvoyMembers = (tripId: string | undefined) => {
  const queryClient = useQueryClient();

  // Subscribe to real-time updates for convoy_members table
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`convoy-members-realtime-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'convoy_members',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Convoy member change detected:', payload);
          // Invalidate query to refetch fresh data with profiles
          queryClient.invalidateQueries({ queryKey: ['convoy-members', tripId] });
        }
      )
      .subscribe((status) => {
        console.log('Convoy members realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);

  return useQuery({
    queryKey: ['convoy-members', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      // Only fetch active convoy members
      const { data, error } = await supabase
        .from('convoy_members')
        .select('*')
        .eq('trip_id', tripId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching convoy members:', error);
        return [];
      }

      // Fetch profiles for members
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds)
        : { data: [] };

      const profileMap = new Map<string, { id: string; username: string | null; display_name: string | null; avatar_url: string | null }>();
      profiles?.forEach(p => profileMap.set(p.id, p));

      return data.map(member => ({
        ...member,
        profile: profileMap.get(member.user_id),
      })) as ConvoyMember[];
    },
    enabled: !!tripId,
  });
};

export const useTransferLeadership = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tripId, newLeaderId }: { tripId: string; newLeaderId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('transfer_convoy_leadership', {
        _trip_id: tripId,
        _new_leader_id: newLeaderId,
      });

      if (error) throw error;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['convoy-members', tripId] });
    },
  });
};

export const useIsConvoyLeader = (tripId: string | undefined) => {
  const { user } = useAuth();
  const { data: members } = useConvoyMembers(tripId);

  if (!user?.id || !members) return false;
  
  const currentMember = members.find(m => m.user_id === user.id);
  return currentMember?.is_leader || false;
};
