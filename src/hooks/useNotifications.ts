import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Tables } from '@/integrations/supabase/types';

export type Notification = Tables<'notifications'>;

export interface NotificationWithActor extends Notification {
  actor?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];

      // Fetch actor profiles
      const actorIds = [...new Set(data.map(n => n.actor_id).filter((id): id is string => id !== null))];
      const { data: profiles } = actorIds.length > 0 
        ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', actorIds)
        : { data: [] };
      const profileMap = new Map<string, typeof profiles extends (infer T)[] | null ? T : never>();
      profiles?.forEach(p => profileMap.set(p.id, p));

      return data.map(n => ({
        ...n,
        actor: n.actor_id ? profileMap.get(n.actor_id) || null : null,
      })) as NotificationWithActor[];
    },
    enabled: !!user?.id,
  });
};

export const useUnreadCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      return count || 0;
    },
    enabled: !!user?.id,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications', user?.id] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase.from('notifications').delete().eq('id', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
};
