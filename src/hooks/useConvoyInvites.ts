import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConvoyInvite {
  id: string;
  trip_id: string;
  inviter_id: string;
  invitee_id: string | null;
  invite_code: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  trip?: {
    id: string;
    title: string;
    start_location: string | null;
    end_location: string | null;
  };
  inviter?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CreateInviteParams {
  tripId: string;
}

interface CreateBulkInvitesParams {
  tripId: string;
  inviteeIds: string[];
}

interface AcceptInviteParams {
  inviteCode: string;
}

export const useConvoyInvites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Generate a unique invite code
  const generateInviteCode = useCallback((): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Create a new invite for a trip
  const createInvite = useMutation({
    mutationFn: async ({ tripId }: CreateInviteParams) => {
      if (!user) throw new Error('Not authenticated');

      const inviteCode = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('convoy_invites')
        .insert({
          trip_id: tripId,
          inviter_id: user.id,
          invite_code: inviteCode,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convoy-invites'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create invite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create bulk invites for multiple invitees (used when starting a trip with convoy)
  const createBulkInvites = useMutation({
    mutationFn: async ({ tripId, inviteeIds }: CreateBulkInvitesParams) => {
      if (!user) throw new Error('Not authenticated');
      if (inviteeIds.length === 0) return [];

      const invites = inviteeIds.map(inviteeId => {
        const inviteCode = generateInviteCode();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        return {
          trip_id: tripId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          invite_code: inviteCode,
          expires_at: expiresAt.toISOString(),
        };
      });

      const { data, error } = await supabase
        .from('convoy_invites')
        .insert(invites)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convoy-invites'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create invites',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get invite by code (for join page)
  const useInviteByCode = (inviteCode: string | null) => {
    return useQuery({
      queryKey: ['convoy-invite', inviteCode],
      queryFn: async () => {
        if (!inviteCode) return null;

        // Fetch invite (no embedded relationships; backend has no FKs)
        const { data: invite, error } = await supabase
          .from('convoy_invites')
          .select('*')
          .eq('invite_code', inviteCode.toUpperCase())
          .maybeSingle();

        if (error) throw error;
        if (!invite) return null;

        // Fetch inviter profile + trip separately
        const [{ data: inviterProfile }, { data: trip }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', invite.inviter_id)
            .maybeSingle(),
          supabase
            .from('trips')
            .select('id, title, start_location, end_location')
            .eq('id', invite.trip_id)
            .maybeSingle(),
        ]);

        return {
          ...invite,
          inviter: inviterProfile,
          trip: trip ?? undefined,
        } as ConvoyInvite;
      },
      enabled: !!inviteCode,
    });
  };

  // Accept an invite
  const acceptInvite = useMutation({
    mutationFn: async ({ inviteCode }: AcceptInviteParams) => {
      if (!user) throw new Error('Not authenticated');

      // Get the invite
      const { data: invite, error: fetchError } = await supabase
        .from('convoy_invites')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (fetchError) throw fetchError;
      if (!invite) throw new Error('Invite not found');

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite has expired');
      }

      // Check if already accepted
      if (invite.status === 'accepted') {
        throw new Error('Invite has already been used');
      }

      // Update invite status
      const { error: updateError } = await supabase
        .from('convoy_invites')
        .update({
          status: 'accepted',
          invitee_id: user.id,
        })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      // Add user to convoy_members
      const { error: memberError } = await supabase
        .from('convoy_members')
        .insert({
          trip_id: invite.trip_id,
          user_id: user.id,
          status: 'active',
          invite_id: invite.id,
        });

      if (memberError) throw memberError;

      return invite;
    },
    onSuccess: (invite) => {
      queryClient.invalidateQueries({ queryKey: ['convoy-invites'] });
      queryClient.invalidateQueries({ queryKey: ['convoy-members', invite.trip_id] });
      toast({
        title: 'Joined convoy!',
        description: 'You are now part of this trip convoy.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to join convoy',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get invites for a trip (for trip owner)
  const useTripInvites = (tripId: string | null) => {
    return useQuery({
      queryKey: ['convoy-invites', tripId],
      queryFn: async () => {
        if (!tripId) return [];

        const { data, error } = await supabase
          .from('convoy_invites')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ConvoyInvite[];
      },
      enabled: !!tripId,
    });
  };

  // Get convoy members for a trip
  const useConvoyMembers = (tripId: string | null) => {
    return useQuery({
      queryKey: ['convoy-members', tripId],
      queryFn: async () => {
        if (!tripId) return [];

        const { data, error } = await supabase
          .from('convoy_members')
          .select(`
            *,
            profile:profiles(id, display_name, avatar_url)
          `)
          .eq('trip_id', tripId)
          .eq('status', 'active');

        if (error) throw error;
        return data;
      },
      enabled: !!tripId,
    });
  };

  // Generate share link
  const getShareLink = useCallback((inviteCode: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join-convoy/${inviteCode}`;
  }, []);

  // Copy invite link to clipboard
  const copyInviteLink = useCallback(async (inviteCode: string) => {
    const link = getShareLink(inviteCode);
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copied!',
        description: 'Share this link with your convoy members.',
      });
      return true;
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getShareLink, toast]);

  // Get pending convoy invites for current user (from notifications)
  const useMyPendingConvoyInvites = () => {
    const { user: currentUser } = useAuth();
    return useQuery({
      queryKey: ['my-convoy-invites', currentUser?.id],
      queryFn: async () => {
        if (!currentUser?.id) return [];
        
        // Fetch invites (no embedded relationships; backend has no FKs)
        const { data: invites, error } = await supabase
          .from('convoy_invites')
          .select('*')
          .eq('invitee_id', currentUser.id)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!invites || invites.length === 0) return [];

        const inviterIds = [...new Set(invites.map(inv => inv.inviter_id))];
        const tripIds = [...new Set(invites.map(inv => inv.trip_id))];

        const [{ data: profiles }, { data: trips }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', inviterIds),
          supabase
            .from('trips')
            .select('id, title, start_location, end_location')
            .in('id', tripIds),
        ]);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const tripMap = new Map(trips?.map(t => [t.id, t]) || []);

        return invites.map(invite => ({
          ...invite,
          inviter: profileMap.get(invite.inviter_id) || null,
          trip: tripMap.get(invite.trip_id) || undefined,
        })) as ConvoyInvite[];
      },
      enabled: !!currentUser?.id,
    });
  };

  // Accept convoy invite by invite ID
  const acceptConvoyInvite = useMutation({
    mutationFn: async ({ inviteId, tripId }: { inviteId: string; tripId: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Update invite status (also ensure invite is claimed by this user)
      const { error: updateError } = await supabase
        .from('convoy_invites')
        .update({ status: 'accepted', invitee_id: user.id })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      // Add user to convoy_members
      const { error: memberError } = await supabase
        .from('convoy_members')
        .insert({
          trip_id: tripId,
          user_id: user.id,
          status: 'active',
          invite_id: inviteId,
        });

      if (memberError) throw memberError;

      return { tripId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-convoy-invites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['convoy-invites'] });
      queryClient.invalidateQueries({ queryKey: ['convoy-members', data.tripId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-convoy', user?.id] });
      toast({
        title: 'Joined convoy!',
        description: 'You are now part of this trip convoy.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to join convoy',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Decline convoy invite
  const declineConvoyInvite = useMutation({
    mutationFn: async ({ inviteId }: { inviteId: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Update invite status to declined
      const { error } = await supabase
        .from('convoy_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-convoy-invites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['convoy-invites'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        title: 'Invitation declined',
        description: 'You declined the convoy invitation.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to decline invite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createInvite,
    createBulkInvites,
    acceptInvite,
    acceptConvoyInvite,
    declineConvoyInvite,
    useInviteByCode,
    useMyPendingConvoyInvites,
    useTripInvites,
    useConvoyMembers,
    getShareLink,
    copyInviteLink,
    isLoading,
  };
};
