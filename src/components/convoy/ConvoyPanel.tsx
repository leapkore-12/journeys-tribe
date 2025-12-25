import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Users, MapPin, Navigation } from 'lucide-react';
import { ConvoyMemberPresence } from '@/hooks/useConvoyPresence';
import { getMemberStatus, getStatusColor } from './ConvoyMemberMarker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ConvoyPanelProps {
  members: ConvoyMemberPresence[];
  userPosition: [number, number] | null;
  isExpanded: boolean;
  onToggle: () => void;
  onMemberClick?: (member: ConvoyMemberPresence) => void;
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

// Determine relative position (ahead/behind)
const getRelativePosition = (
  userPos: [number, number] | null,
  memberPos: [number, number],
  destination?: [number, number]
): 'ahead' | 'behind' | 'unknown' => {
  if (!userPos || !destination) return 'unknown';
  
  const userToDestDist = calculateDistance(userPos, destination);
  const memberToDestDist = calculateDistance(memberPos, destination);
  
  return memberToDestDist < userToDestDist ? 'ahead' : 'behind';
};

const ConvoyPanel: React.FC<ConvoyPanelProps> = ({
  members,
  userPosition,
  isExpanded,
  onToggle,
  onMemberClick,
}) => {
  // Sort members by distance from user
  const sortedMembers = React.useMemo(() => {
    if (!userPosition) return members;
    
    return [...members].sort((a, b) => {
      const distA = calculateDistance(userPosition, a.position);
      const distB = calculateDistance(userPosition, b.position);
      return distA - distB;
    });
  }, [members, userPosition]);

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
              {members.length} {members.length === 1 ? 'rider' : 'riders'} connected
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick status indicators */}
          <div className="flex -space-x-2">
            {sortedMembers.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="w-6 h-6 border-2 border-card">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {member.name[0]}
                </AvatarFallback>
              </Avatar>
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
                const distance = userPosition
                  ? calculateDistance(userPosition, member.position)
                  : null;

                return (
                  <button
                    key={member.id}
                    onClick={() => onMemberClick?.(member)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    {/* Avatar with status */}
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card"
                        style={{ backgroundColor: statusColor }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">
                        {member.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {member.speed ? (
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {Math.round(member.speed)} km/h
                          </span>
                        ) : (
                          <span className="capitalize">{status}</span>
                        )}
                        {distance !== null && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(distance)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div
                      className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                      }}
                    >
                      {status}
                    </div>
                  </button>
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
    </motion.div>
  );
};

export default ConvoyPanel;
