import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ConvoyMemberPresence {
  id: string;
  name: string;
  avatar?: string;
  position: [number, number];
  heading?: number;
  speed?: number;
  lastUpdate: number;
}

interface UseConvoyPresenceOptions {
  tripId: string | null;
  enabled?: boolean;
}

export const useConvoyPresence = ({ tripId, enabled = true }: UseConvoyPresenceOptions) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ConvoyMemberPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Update own position in the convoy
  const updatePosition = useCallback(
    async (
      position: [number, number],
      heading?: number | null,
      speed?: number | null
    ) => {
      if (!channelRef.current || !user || !tripId) return;

      try {
        await channelRef.current.track({
          user_id: user.id,
          name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown',
          avatar: user.user_metadata?.avatar_url,
          position,
          heading: heading ?? undefined,
          speed: speed ?? undefined,
          lastUpdate: Date.now(),
        });
      } catch (err) {
        console.error('Failed to update position:', err);
      }
    },
    [user, tripId]
  );

  // Subscribe to convoy channel
  useEffect(() => {
    if (!tripId || !user || !enabled) {
      setMembers([]);
      setIsConnected(false);
      return;
    }

    const channelName = `convoy:${tripId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const membersList: ConvoyMemberPresence[] = [];

        Object.entries(presenceState).forEach(([userId, presences]) => {
          // Get the most recent presence for this user
          const latestPresence = (presences as any[])[0];
          if (latestPresence && userId !== user.id) {
            membersList.push({
              id: userId,
              name: latestPresence.name || 'Unknown',
              avatar: latestPresence.avatar,
              position: latestPresence.position || [0, 0],
              heading: latestPresence.heading,
              speed: latestPresence.speed,
              lastUpdate: latestPresence.lastUpdate || Date.now(),
            });
          }
        });

        setMembers(membersList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Member joined convoy:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Member left convoy:', key, leftPresences);
        setMembers((prev) => prev.filter((m) => m.id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          channelRef.current = channel;
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to convoy channel');
          setIsConnected(false);
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [tripId, user, enabled]);

  // Leave convoy
  const leaveConvoy = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
    }
  }, []);

  return {
    members,
    isConnected,
    error,
    updatePosition,
    leaveConvoy,
  };
};
