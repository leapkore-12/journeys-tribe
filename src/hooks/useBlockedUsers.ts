import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface BlockedUserWithProfile {
  id: string;
  blocked_id: string;
  created_at: string;
  profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useBlockedUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async (): Promise<BlockedUserWithProfile[]> => {
      if (!user?.id) return [];

      // First get blocked user IDs
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_users')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (blockedError) throw blockedError;
      if (!blockedData || blockedData.length === 0) return [];

      // Then fetch profiles for blocked users
      const blockedIds = blockedData.map(b => b.blocked_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', blockedIds);

      if (profilesError) throw profilesError;

      // Map profiles to blocked users
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return blockedData.map(b => ({
        id: b.id,
        blocked_id: b.blocked_id,
        created_at: b.created_at,
        profile: profileMap.get(b.blocked_id) || null,
      }));
    },
    enabled: !!user?.id,
  });
};

export const useIsBlocked = (userId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-blocked', user?.id, userId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !userId) return false;

      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!userId,
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: blockedId });

      if (error) throw error;
    },
    onSuccess: (_, blockedId) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['is-blocked', user?.id, blockedId] });
      // Invalidate follow queries since the trigger removes follows on block
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['pending-request'] });
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;
    },
    onSuccess: (_, blockedId) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['is-blocked', user?.id, blockedId] });
    },
  });
};
