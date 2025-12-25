import React from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi, WifiOff, Share2 } from 'lucide-react';
import { ConvoyMemberPresence } from '@/hooks/useConvoyPresence';
import { getMemberStatus } from './ConvoyMemberMarker';

interface ConvoyStatusBarProps {
  members: ConvoyMemberPresence[];
  isConnected: boolean;
  isOnline: boolean;
  onShareInvite?: () => void;
  className?: string;
}

const ConvoyStatusBar: React.FC<ConvoyStatusBarProps> = ({
  members,
  isConnected,
  isOnline,
  onShareInvite,
  className = '',
}) => {
  // Count members by status
  const statusCounts = React.useMemo(() => {
    return members.reduce(
      (acc, member) => {
        const status = getMemberStatus(member);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [members]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 ${className}`}
    >
      {/* Connection status */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg ${
          isConnected && isOnline
            ? 'bg-primary text-primary-foreground'
            : 'bg-destructive text-destructive-foreground'
        }`}
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isConnected ? (
          <>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span>{members.length} in convoy</span>
          </>
        ) : isOnline ? (
          <span>Connecting...</span>
        ) : (
          <span>Offline</span>
        )}
      </div>

      {/* Quick stats when connected */}
      {isConnected && members.length > 0 && (
        <div className="flex items-center gap-1">
          {statusCounts.moving && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full text-xs text-green-400">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              {statusCounts.moving}
            </div>
          )}
          {statusCounts.stopped && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full text-xs text-red-400">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              {statusCounts.stopped}
            </div>
          )}
        </div>
      )}

      {/* Share invite button */}
      {onShareInvite && (
        <button
          onClick={onShareInvite}
          className="p-2 bg-card rounded-full shadow-lg hover:bg-secondary transition-colors"
        >
          <Share2 className="h-4 w-4 text-foreground" />
        </button>
      )}
    </motion.div>
  );
};

export default ConvoyStatusBar;
