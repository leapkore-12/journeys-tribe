import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Users, MapPin, Navigation, Crown, WifiOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTransferLeadership } from '@/hooks/useConvoyMembers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MergedConvoyMember } from '@/pages/ActiveTrip';

interface ConvoyPanelProps {
  members: MergedConvoyMember[];
  userPosition: [number, number] | null;
  isExpanded: boolean;
  onToggle: () => void;
  onMemberClick?: (member: MergedConvoyMember) => void;
  tripId?: string;
  currentLeaderId?: string;
}

// Calculate distance between two coordinates in km
const calculateDistance = (pos1: [number, number], pos2: [number, number]): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((pos2[1] - pos1[1]) * Math.PI) / 180;
  const dLon = ((pos2[0] - pos1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1[1] * Math.PI) / 180) *
      Math.cos((pos2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance for display
const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

// Get member status based on speed and connection
const getMemberStatus = (member: MergedConvoyMember): 'moving' | 'slow' | 'stopped' | 'offline' => {
  if (!member.isConnected) return 'offline';
  
  // Check if stale (no update in 30 seconds)
  if (member.lastUpdate && Date.now() - member.lastUpdate > 30000) {
    return 'offline';
  }
  
  if (!member.speed || member.speed < 2) return 'stopped';
  if (member.speed < 20) return 'slow';
  return 'moving';
};

// Get status color
const getStatusColor = (status: 'moving' | 'slow' | 'stopped' | 'offline'): string => {
  switch (status) {
    case 'moving': return '#22c55e';
    case 'slow': return '#f59e0b';
    case 'stopped': return '#ef4444';
    case 'offline': return '#6b7280';
  }
};

const ConvoyPanel: React.FC<ConvoyPanelProps> = ({
  members,
  userPosition,
  isExpanded,
  onToggle,
  onMemberClick,
  tripId,
  currentLeaderId,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const transferLeadership = useTransferLeadership();
  const [transferTarget, setTransferTarget] = useState<MergedConvoyMember | null>(null);
  
  const isCurrentUserLeader = user?.id === currentLeaderId;

  // Sort members: connected first, then by distance
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      // Connected members first
      if (a.isConnected !== b.isConnected) {
        return a.isConnected ? -1 : 1;
      }
      
      // Then by distance if we have positions
      if (userPosition && a.position && b.position) {
        const distA = calculateDistance(userPosition, a.position);
        const distB = calculateDistance(userPosition, b.position);
        return distA - distB;
      }
      
      return 0;
    });
  }, [members, userPosition]);

  // Count connected vs total
  const connectedCount = members.filter(m => m.isConnected).length;
  const totalCount = members.length;

  const handleTransferLeadership = async () => {
    if (!tripId || !transferTarget) return;
    
    try {
      await transferLeadership.mutateAsync({
        tripId,
        newLeaderId: transferTarget.id,
      });
      
      toast({
        title: 'Leadership transferred',
        description: `${transferTarget.name} is now the convoy leader.`,
      });
    } catch (error) {
      toast({
        title: 'Transfer failed',
        description: 'Could not transfer leadership. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTransferTarget(null);
    }
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="bg-card rounded-t-2xl shadow-lg border border-border/50 overflow-hidden"
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-card"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">
              Convoy Members
            </p>
            <p className="text-xs text-muted-foreground">
              {connectedCount === totalCount 
                ? `${totalCount} ${totalCount === 1 ? 'rider' : 'riders'} connected`
                : `${connectedCount}/${totalCount} connected`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick status indicators */}
          <div className="flex -space-x-2">
            {sortedMembers.slice(0, 3).map((member) => (
              <div key={member.id} className="relative">
                <Avatar className="w-6 h-6 border-2 border-card">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
                {!member.isConnected && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-muted-foreground rounded-full border border-card" />
                )}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                +{members.length - 3}
              </div>
            )}
          </div>
          
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
              {sortedMembers.map((member) => {
                const status = getMemberStatus(member);
                const statusColor = getStatusColor(status);
                const distance = userPosition && member.position
                  ? calculateDistance(userPosition, member.position)
                  : null;
                const isLeader = member.id === currentLeaderId;
                const canTransfer = isCurrentUserLeader && !isLeader && tripId && member.isConnected;

                return (
                  <div
                    key={member.id}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      member.isConnected ? 'bg-secondary/50 hover:bg-secondary' : 'bg-muted/30'
                    }`}
                  >
                    {/* Avatar with status */}
                    <button
                      onClick={() => onMemberClick?.(member)}
                      className="relative"
                    >
                      <Avatar className={`w-10 h-10 ${!member.isConnected ? 'opacity-50' : ''}`}>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card"
                        style={{ backgroundColor: statusColor }}
                      />
                      {isLeader && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-card">
                          <Crown className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>

                    {/* Info */}
                    <button
                      onClick={() => onMemberClick?.(member)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${member.isConnected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {member.name}
                        </p>
                        {isLeader && (
                          <span className="text-xs text-yellow-500 font-medium">Leader</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {!member.isConnected ? (
                          <span className="flex items-center gap-1">
                            <WifiOff className="h-3 w-3" />
                            Offline
                          </span>
                        ) : member.speed ? (
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {Math.round(member.speed)} km/h
                          </span>
                        ) : (
                          <span className="capitalize">{status}</span>
                        )}
                        {distance !== null && member.isConnected && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(distance)}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Transfer button or status badge */}
                    {canTransfer ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransferTarget(member)}
                        className="text-xs px-2 py-1 h-7"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Make Leader
                      </Button>
                    ) : (
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                        style={{
                          backgroundColor: `${statusColor}20`,
                          color: statusColor,
                        }}
                      >
                        {status}
                      </div>
                    )}
                  </div>
                );
              })}

              {members.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No convoy members yet</p>
                  <p className="text-xs">Share your invite link to add riders</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Leadership Confirmation Dialog */}
      <AlertDialog open={!!transferTarget} onOpenChange={() => setTransferTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Leadership?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make <strong>{transferTarget?.name}</strong> the convoy leader? 
              They will be able to set the route and add stops.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTransferLeadership}
              disabled={transferLeadership.isPending}
            >
              {transferLeadership.isPending ? 'Transferring...' : 'Transfer Leadership'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ConvoyPanel;
