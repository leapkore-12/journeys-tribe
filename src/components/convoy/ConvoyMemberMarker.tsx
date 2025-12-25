import React from 'react';
import { ConvoyMemberPresence } from '@/hooks/useConvoyPresence';

interface ConvoyMemberMarkerProps {
  member: ConvoyMemberPresence;
  isStale?: boolean;
}

// Utility to determine member status based on speed and last update
export const getMemberStatus = (member: ConvoyMemberPresence): 'moving' | 'slow' | 'stopped' | 'offline' => {
  const now = Date.now();
  const timeSinceUpdate = now - member.lastUpdate;
  
  // If no update in 30 seconds, consider offline
  if (timeSinceUpdate > 30000) {
    return 'offline';
  }
  
  // Check speed
  if (!member.speed || member.speed < 1) {
    return 'stopped';
  }
  
  if (member.speed < 20) {
    return 'slow';
  }
  
  return 'moving';
};

// Get status color based on member status
export const getStatusColor = (status: 'moving' | 'slow' | 'stopped' | 'offline'): string => {
  switch (status) {
    case 'moving':
      return '#22c55e'; // green
    case 'slow':
      return '#eab308'; // yellow
    case 'stopped':
      return '#ef4444'; // red
    case 'offline':
      return '#6b7280'; // gray
    default:
      return '#22c55e';
  }
};

// Create HTML for convoy member marker
export const createConvoyMarkerElement = (member: ConvoyMemberPresence): HTMLDivElement => {
  const status = getMemberStatus(member);
  const statusColor = getStatusColor(status);
  
  const el = document.createElement('div');
  el.className = 'convoy-member-marker';
  el.style.cssText = 'position: relative; cursor: pointer;';
  
  // Calculate rotation for heading arrow
  const rotation = member.heading || 0;
  
  el.innerHTML = `
    <div style="position: relative;">
      <!-- Heading arrow (shows direction) -->
      ${member.heading !== undefined ? `
        <div style="
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%) rotate(${rotation}deg);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 10px solid ${statusColor};
          transform-origin: center bottom;
        "></div>
      ` : ''}
      
      <!-- Avatar container -->
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid ${statusColor};
        overflow: hidden;
        background: #1a1a2e;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        position: relative;
      ">
        ${member.avatar
          ? `<img src="${member.avatar}" style="width: 100%; height: 100%; object-fit: cover;" />`
          : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">${member.name[0].toUpperCase()}</div>`
        }
        
        <!-- Status indicator dot -->
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: ${statusColor};
          border: 2px solid white;
          border-radius: 50%;
        "></div>
      </div>
      
      <!-- Name label -->
      <div style="
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 4px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        font-weight: 500;
      ">
        ${member.name.split(' ')[0]}
        ${member.speed ? `<span style="opacity: 0.7; margin-left: 4px;">${Math.round(member.speed)} km/h</span>` : ''}
      </div>
    </div>
  `;
  
  return el;
};

// React component version (for non-map uses)
const ConvoyMemberMarker: React.FC<ConvoyMemberMarkerProps> = ({ member, isStale = false }) => {
  const status = getMemberStatus(member);
  const statusColor = getStatusColor(status);
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Avatar */}
      <div 
        className="w-10 h-10 rounded-full overflow-hidden relative"
        style={{ border: `3px solid ${statusColor}` }}
      >
        {member.avatar ? (
          <img 
            src={member.avatar} 
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {member.name[0].toUpperCase()}
          </div>
        )}
        
        {/* Status dot */}
        <div 
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
          style={{ backgroundColor: statusColor }}
        />
      </div>
      
      {/* Name */}
      <span className="text-xs text-foreground mt-1 font-medium">
        {member.name.split(' ')[0]}
      </span>
      
      {/* Speed */}
      {member.speed && (
        <span className="text-xs text-muted-foreground">
          {Math.round(member.speed)} km/h
        </span>
      )}
    </div>
  );
};

export default ConvoyMemberMarker;
