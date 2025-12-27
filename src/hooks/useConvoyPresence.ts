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
  vehicleType?: 'car' | 'bike' | 'truck';
}

interface UseConvoyPresenceOptions {
  tripId: string | null;
  enabled?: boolean;
  onMemberJoin?: (member: ConvoyMemberPresence) => void;
  onMemberLeave?: (memberId: string) => void;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000;
const STALE_THRESHOLD = 30000; // 30 seconds

export const useConvoyPresence = ({ 
  tripId, 
  enabled = true,
  onMemberJoin,
  onMemberLeave,
}: UseConvoyPresenceOptions) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ConvoyMemberPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store callbacks in refs to avoid dependency issues
  const onMemberJoinRef = useRef(onMemberJoin);
  const onMemberLeaveRef = useRef(onMemberLeave);
  
  // Keep refs updated
  useEffect(() => {
    onMemberJoinRef.current = onMemberJoin;
    onMemberLeaveRef.current = onMemberLeave;
  }, [onMemberJoin, onMemberLeave]);

  // Update own position in the convoy
  const updatePosition = useCallback(
    async (
      position: [number, number],
      heading?: number | null,
      speed?: number | null,
      vehicleType?: 'car' | 'bike' | 'truck'
    ) => {
      if (!channelRef.current || !user || !tripId) return;

      try {
        console.log('[ConvoyPresence] Broadcasting position:', position);
        await channelRef.current.track({
          user_id: user.id,
          name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown',
          avatar: user.user_metadata?.avatar_url,
          position,
          heading: heading ?? undefined,
          speed: speed ?? undefined,
          vehicleType: vehicleType ?? 'car',
          lastUpdate: Date.now(),
        });
      } catch (err) {
        console.error('Failed to update position:', err);
        setError('Failed to update position');
      }
    },
    [user, tripId]
  );

  // Connect to convoy channel with retry logic
  const connect = useCallback(() => {
    if (!tripId || !user || !enabled) return;
    if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
      setError('Maximum connection attempts reached. Please try again.');
      return;
    }

    const channelName = `convoy:${tripId}`;
    
    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
              vehicleType: latestPresence.vehicleType || 'car',
            });
          }
        });

        setMembers(membersList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[ConvoyPresence] Member joined convoy:', key, newPresences);
        const presence = (newPresences as any[])[0];
        if (presence && key !== user.id) {
          const newMember: ConvoyMemberPresence = {
            id: key,
            name: presence.name || 'Unknown',
            avatar: presence.avatar,
            position: presence.position || [0, 0],
            heading: presence.heading,
            speed: presence.speed,
            lastUpdate: presence.lastUpdate || Date.now(),
            vehicleType: presence.vehicleType || 'car',
          };
          onMemberJoinRef.current?.(newMember);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[ConvoyPresence] Member left convoy:', key, leftPresences);
        setMembers((prev) => prev.filter((m) => m.id !== key));
        if (key !== user.id) {
          onMemberLeaveRef.current?.(key);
        }
      })
      .subscribe(async (status) => {
        console.log('[ConvoyPresence] Subscription status:', status, 'for trip:', tripId);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          setConnectionAttempts(0);
          channelRef.current = channel;
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to convoy channel');
          setIsConnected(false);
          setConnectionAttempts((prev) => prev + 1);
          
          // Retry connection
          if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
            retryTimeoutRef.current = setTimeout(() => {
              connect();
            }, RETRY_DELAY * (connectionAttempts + 1));
          }
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [tripId, user, enabled, connectionAttempts]);

  // Subscribe to convoy channel
  useEffect(() => {
    if (!tripId || !user || !enabled) {
      setMembers([]);
      setIsConnected(false);
      return;
    }

    connect();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [tripId, user, enabled, connect]);

  // Leave convoy
  const leaveConvoy = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
    }
  }, []);

  // Retry connection manually
  const retryConnection = useCallback(() => {
    setConnectionAttempts(0);
    setError(null);
    connect();
  }, [connect]);

  // Get stale members (haven't updated in STALE_THRESHOLD)
  const staleMembers = members.filter(
    (m) => Date.now() - m.lastUpdate > STALE_THRESHOLD
  );

  // Get active members
  const activeMembers = members.filter(
    (m) => Date.now() - m.lastUpdate <= STALE_THRESHOLD
  );

  return {
    members,
    activeMembers,
    staleMembers,
    isConnected,
    error,
    updatePosition,
    leaveConvoy,
    retryConnection,
    connectionAttempts,
  };
};
