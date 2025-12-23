import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface CommentWithProfile {
  id: string;
  trip_id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  profile?: { id: string; username: string | null; display_name: string | null; avatar_url: string | null; } | null;
}

export const useComments = (tripId: string) => {
  return useQuery({
    queryKey: ['comments', tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from('comments').select('*').eq('trip_id', tripId).order('created_at', { ascending: true });
      if (error || !data) return [];

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(c => ({ ...c, profile: profileMap.get(c.user_id) || null })) as CommentWithProfile[];
    },
    enabled: !!tripId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tripId, content }: { tripId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('comments').insert({ trip_id: tripId, user_id: user.id, content }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', tripId] });
      queryClient.invalidateQueries({ queryKey: ['feed-trips'] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, tripId }: { commentId: string; tripId: string }) => {
      await supabase.from('comments').delete().eq('id', commentId);
      return tripId;
    },
    onSuccess: (tripId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', tripId] });
    },
  });
};
