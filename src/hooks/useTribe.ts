import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface TribeMember {
  id: string;
  member_id: string;
  created_at: string;
  profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch all tribe members for current user
export const useTribe = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tribe', user?.id],
    queryFn: async (): Promise<TribeMember[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('tribe_members')
        .select(`
          id,
          member_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tribe:', error);
        return [];
      }

      // Fetch profiles for each member
      const memberIds = data.map(m => m.member_id);
      if (memberIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', memberIds);

      if (profilesError) {
        console.error('Error fetching tribe profiles:', profilesError);
        return [];
      }

      return data.map(member => ({
        ...member,
        profile: profiles?.find(p => p.id === member.member_id) || null,
      }));
    },
    enabled: !!user?.id,
  });
};

// Add someone to tribe (must be someone you follow)
export const useAddToTribe = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if already in tribe
      const { data: existing } = await supabase
        .from('tribe_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('member_id', memberId)
        .maybeSingle();

      if (existing) {
        throw new Error('Already in your tribe');
      }

      const { error } = await supabase
        .from('tribe_members')
        .insert({
          user_id: user.id,
          member_id: memberId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribe', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
};

// Remove from tribe
export const useRemoveFromTribe = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tribe_members')
        .delete()
        .eq('user_id', user.id)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribe', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
};

// Check if a specific user is in your tribe
export const useIsTribeMember = (memberId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isTribeMember', user?.id, memberId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !memberId) return false;

      const { data, error } = await supabase
        .from('tribe_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('member_id', memberId)
        .maybeSingle();

      if (error) {
        console.error('Error checking tribe membership:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && !!memberId,
  });
};

// Get tribe member IDs as a Set for quick lookups
export const useTribeMemberIds = () => {
  const { data: tribe = [] } = useTribe();
  return new Set(tribe.map(m => m.member_id));
};
