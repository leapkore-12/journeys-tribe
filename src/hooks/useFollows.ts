import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface FollowerWithProfile {
  id: string;
  follower_id: string;
  following_id: string;
  profile?: { id: string; username: string | null; display_name: string | null; avatar_url: string | null; } | null;
  is_following_back: boolean;
}

export interface FollowRequestWithProfile {
  id: string;
  requester_id: string;
  target_id: string;
  status: string | null;
  created_at: string | null;
  profile?: { id: string; username: string | null; display_name: string | null; avatar_url: string | null; } | null;
}

export const useFollowers = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['followers', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data: followers } = await supabase.from('follows').select('*').eq('following_id', targetId);
      if (!followers) return [];

      const ids = followers.map(f => f.follower_id);
      const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const { data: following } = user?.id ? await supabase.from('follows').select('following_id').eq('follower_id', user.id) : { data: [] };
      const followingIds = new Set(following?.map(f => f.following_id) || []);

      return followers.map(f => ({ ...f, profile: profileMap.get(f.follower_id), is_following_back: followingIds.has(f.follower_id) })) as FollowerWithProfile[];
    },
    enabled: !!targetId,
  });
};

export const useFollowing = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['following', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data: following } = await supabase.from('follows').select('*').eq('follower_id', targetId);
      if (!following) return [];

      const ids = following.map(f => f.following_id);
      const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const { data: followers } = user?.id ? await supabase.from('follows').select('follower_id').eq('following_id', user.id) : { data: [] };
      const followerIds = new Set(followers?.map(f => f.follower_id) || []);

      return following.map(f => ({ ...f, profile: profileMap.get(f.following_id), is_following_back: followerIds.has(f.following_id) })) as FollowerWithProfile[];
    },
    enabled: !!targetId,
  });
};

export const useFollowRequests = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['follow-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: requests } = await supabase.from('follow_requests').select('*').eq('target_id', user.id).eq('status', 'pending');
      if (!requests) return [];

      const ids = requests.map(r => r.requester_id);
      const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return requests.map(r => ({ ...r, profile: profileMap.get(r.requester_id) })) as FollowRequestWithProfile[];
    },
    enabled: !!user?.id,
  });
};

export const useIsFollowing = (targetUserId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-following', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return false;
      const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId,
  });
};

// Check if current user has a pending follow request to target
export const usePendingRequest = (targetUserId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pending-request', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return null;
      const { data } = await supabase
        .from('follow_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('target_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!targetUserId,
  });
};

// Get mutual followers (followers of target that current user also follows)
export const useMutualFollowers = (targetUserId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['mutual-followers', user?.id, targetUserId],
    queryFn: async (): Promise<{ profiles: Array<{ id: string; username: string | null; display_name: string | null; avatar_url: string | null }>; totalCount: number }> => {
      if (!user?.id || !targetUserId || user.id === targetUserId) {
        return { profiles: [], totalCount: 0 };
      }
      
      // Get target's followers
      const { data: targetFollowers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', targetUserId);
      
      if (!targetFollowers || targetFollowers.length === 0) {
        return { profiles: [], totalCount: 0 };
      }
      
      // Get users that current user follows
      const { data: myFollowing } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      if (!myFollowing) {
        return { profiles: [], totalCount: 0 };
      }
      
      const myFollowingIds = new Set(myFollowing.map(f => f.following_id));
      const mutualIds = targetFollowers
        .map(f => f.follower_id)
        .filter(id => myFollowingIds.has(id));
      
      if (mutualIds.length === 0) {
        return { profiles: [], totalCount: 0 };
      }
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', mutualIds)
        .limit(3);
      
      return { profiles: profiles || [], totalCount: mutualIds.length };
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if target is a private account
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', targetUserId)
        .single();
      
      if (targetProfile?.is_private) {
        // Create a follow request instead of direct follow
        await supabase.from('follow_requests').insert({
          requester_id: user.id,
          target_id: targetUserId,
          status: 'pending'
        });
        return { type: 'request' };
      } else {
        // Direct follow for public accounts
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
        return { type: 'follow' };
      }
    },
    onSuccess: (result, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['pending-request', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useCancelFollowRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_id', user.id)
        .eq('target_id', targetUserId)
        .eq('status', 'pending');
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['pending-request', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    },
  });
};

export const useAcceptFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data: request } = await supabase.from('follow_requests').select('*').eq('id', requestId).single();
      if (!request) throw new Error('Request not found');
      await supabase.from('follow_requests').update({ status: 'accepted' }).eq('id', requestId);
      await supabase.from('follows').insert({ follower_id: request.requester_id, following_id: request.target_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });
};

export const useDeclineFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      await supabase.from('follow_requests').update({ status: 'declined' }).eq('id', requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    },
  });
};
