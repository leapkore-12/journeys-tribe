import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
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

interface UseConvoyMembersOptions {
  onMemberJoin?: (member: ConvoyMember) => void;
  onMemberLeave?: (memberId: string) => void;
}

export const useConvoyMembers = (tripId: string | undefined, options?: UseConvoyMembersOptions) => {
  const queryClient = useQueryClient();
  const isInitialLoadRef = useRef(true);
  const knownMemberIdsRef = useRef<Set<string>>(new Set());
  
  // Store callbacks in refs to avoid dependency issues
  const onMemberJoinRef = useRef(options?.onMemberJoin);
  const onMemberLeaveRef = useRef(options?.onMemberLeave);
  
  // Keep refs updated
  useEffect(() => {
    onMemberJoinRef.current = options?.onMemberJoin;
    onMemberLeaveRef.current = options?.onMemberLeave;
  }, [options?.onMemberJoin, options?.onMemberLeave]);

  // Subscribe to real-time updates for convoy_members table
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`convoy-members-realtime-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convoy_members',
          filter: `trip_id=eq.${tripId}`,
        },
        async (payload) => {
          console.log('Convoy member INSERT detected:', payload);
          
          // Only trigger callback if not initial load and status is active
          if (!isInitialLoadRef.current && payload.new.status === 'active') {
            const newMemberId = payload.new.user_id as string;
            
            // Check if we already know about this member
            if (!knownMemberIdsRef.current.has(newMemberId)) {
              knownMemberIdsRef.current.add(newMemberId);
              
              // Fetch profile for the new member
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .eq('id', newMemberId)
                .single();
              
              if (onMemberJoinRef.current && profile) {
                onMemberJoinRef.current({
                  ...(payload.new as any),
                  profile,
                });
              }
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ['convoy-members', tripId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'convoy_members',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Convoy member UPDATE detected:', payload);
          
          // Check if member left (status changed to 'left')
          if (payload.new.status === 'left' && payload.old?.status === 'active') {
            const leftMemberId = payload.new.user_id as string;
            knownMemberIdsRef.current.delete(leftMemberId);
            
            if (onMemberLeaveRef.current) {
              onMemberLeaveRef.current(leftMemberId);
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ['convoy-members', tripId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'convoy_members',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Convoy member DELETE detected:', payload);
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

  const query = useQuery({
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

      const members = data.map(member => ({
        ...member,
        profile: profileMap.get(member.user_id),
      })) as ConvoyMember[];

      // Update known member IDs and mark initial load complete
      knownMemberIdsRef.current = new Set(members.map(m => m.user_id));
      isInitialLoadRef.current = false;

      return members;
    },
    enabled: !!tripId,
  });

  return query;
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
