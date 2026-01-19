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
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000;
const STALE_THRESHOLD = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds - keep presence fresh

export const useConvoyPresence = ({ 
  tripId, 
  enabled = true,
}: UseConvoyPresenceOptions) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ConvoyMemberPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptsRef = useRef(0);
  
  // Store the last known presence payload for announce-on-connect and heartbeat
  const lastPresenceRef = useRef<{
    position: [number, number];
    heading?: number | null;
    speed?: number | null;
    vehicleType?: 'car' | 'bike' | 'truck';
  } | null>(null);

  // Parse presence state and pick the newest update per user
  const parsePresenceState = useCallback((presenceState: Record<string, any[]>, currentUserId: string): ConvoyMemberPresence[] => {
    const membersList: ConvoyMemberPresence[] = [];

    Object.entries(presenceState).forEach(([userId, presences]) => {
      // Skip self
      if (userId === currentUserId) return;
      
      // Pick the presence with the newest lastUpdate (in case of multiple connections)
      const sortedPresences = [...(presences as any[])].sort(
        (a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0)
      );
      const latestPresence = sortedPresences[0];
      
      if (latestPresence?.position) {
        membersList.push({
          id: userId,
          name: latestPresence.name || 'Unknown',
          avatar: latestPresence.avatar,
          position: latestPresence.position,
          heading: latestPresence.heading,
          speed: latestPresence.speed,
          lastUpdate: latestPresence.lastUpdate || Date.now(),
          vehicleType: latestPresence.vehicleType || 'car',
        });
      }
    });

    return membersList;
  }, []);

  // Track presence (announce position)
  const trackPresence = useCallback(async () => {
    if (!channelRef.current || !user || !lastPresenceRef.current) {
      console.log('[ConvoyPresence] Cannot track - missing channel, user, or position');
      return;
    }

    const payload = {
      user_id: user.id,
      name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown',
      avatar: user.user_metadata?.avatar_url,
      position: lastPresenceRef.current.position,
      heading: lastPresenceRef.current.heading ?? undefined,
      speed: lastPresenceRef.current.speed ?? undefined,
      vehicleType: lastPresenceRef.current.vehicleType ?? 'car',
      lastUpdate: Date.now(),
    };

    try {
      console.log('[ConvoyPresence] Tracking presence:', payload.position);
      await channelRef.current.track(payload);
    } catch (err) {
      console.error('[ConvoyPresence] Failed to track presence:', err);
    }
  }, [user]);

  // Update own position in the convoy
  const updatePosition = useCallback(
    async (
      position: [number, number],
      heading?: number | null,
      speed?: number | null,
      vehicleType?: 'car' | 'bike' | 'truck'
    ) => {
      // Always store the latest position (even if not connected yet)
      lastPresenceRef.current = { position, heading, speed, vehicleType };

      // If connected, track immediately
      if (channelRef.current && user && isConnected) {
        await trackPresence();
      }
    },
    [user, isConnected, trackPresence]
  );

  // Start heartbeat interval
  const startHeartbeat = useCallback(() => {
    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Re-track every HEARTBEAT_INTERVAL to keep presence fresh
    heartbeatIntervalRef.current = setInterval(() => {
      if (isConnected && lastPresenceRef.current) {
        console.log('[ConvoyPresence] Heartbeat re-track');
        trackPresence();
      }
    }, HEARTBEAT_INTERVAL);
  }, [isConnected, trackPresence]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Connect to convoy channel
  const connect = useCallback(() => {
    if (!tripId || !user || !enabled) return;
    
    if (connectionAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
      setError('Maximum connection attempts reached. Please try again.');
      return;
    }

    const channelName = `convoy:${tripId}`;
    console.log('[ConvoyPresence] Connecting to channel:', channelName);
    
    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
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
        const membersList = parsePresenceState(presenceState, user.id);
        console.log('[ConvoyPresence] Sync - members:', membersList.length);
        setMembers(membersList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[ConvoyPresence] Member presence joined:', key);
        // The sync event will handle the state update
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[ConvoyPresence] Member presence left:', key);
        // The sync event will handle the state update
      })
      .subscribe(async (status) => {
        console.log('[ConvoyPresence] Subscription status:', status, 'for trip:', tripId);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          connectionAttemptsRef.current = 0;
          channelRef.current = channel;
          
          // Announce on connect - immediately track if we have a position
          if (lastPresenceRef.current) {
            console.log('[ConvoyPresence] Announcing on connect');
            // Small delay to ensure channel is fully ready
            setTimeout(() => trackPresence(), 100);
          }
          
          // Start heartbeat to keep presence fresh
          startHeartbeat();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ConvoyPresence] Channel error');
          setError('Failed to connect to convoy channel');
          setIsConnected(false);
          stopHeartbeat();
          connectionAttemptsRef.current += 1;
          
          // Retry connection
          if (connectionAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
            retryTimeoutRef.current = setTimeout(() => {
              connect();
            }, RETRY_DELAY * connectionAttemptsRef.current);
          }
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          stopHeartbeat();
        }
      });
  }, [tripId, user, enabled, parsePresenceState, trackPresence, startHeartbeat, stopHeartbeat]);

  // Subscribe to convoy channel
  useEffect(() => {
    if (!tripId || !user || !enabled) {
      setMembers([]);
      setIsConnected(false);
      stopHeartbeat();
      return;
    }

    // Reset connection attempts on new connection
    connectionAttemptsRef.current = 0;
    connect();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      stopHeartbeat();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [tripId, user?.id, enabled]); // Only depend on user.id, not the whole user object

  // Leave convoy
  const leaveConvoy = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
    }
    stopHeartbeat();
  }, [stopHeartbeat]);

  // Retry connection manually
  const retryConnection = useCallback(() => {
    connectionAttemptsRef.current = 0;
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
    connectionAttempts: connectionAttemptsRef.current,
  };
};
