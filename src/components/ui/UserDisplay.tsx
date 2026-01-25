'use client'

import React from 'react'
import { useUserAlias } from '@/hooks/useUserAlias'

interface UserDisplayProps {
  walletAddress: string;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  className?: string;
  showFullAddress?: boolean;
}

/**
 * UserDisplay component
 * Displays a user's identity with priority: alias → truncated address
 * Optionally shows an avatar with initials based on wallet address
 */
export function UserDisplay({ 
  walletAddress, 
  showAvatar = false, 
  avatarSize = 'md',
  className = '',
  showFullAddress = false,
}: UserDisplayProps) {
  const { displayName, isCustomAlias, isLoading } = useUserAlias(walletAddress);

  // Generate avatar initials from wallet address
  const initials = walletAddress ? walletAddress.slice(2, 4).toUpperCase() : '??';

  // Avatar sizes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  // Generate a deterministic color based on wallet address
  const getAvatarGradient = (address: string): string => {
    const hash = address.slice(2, 10);
    const hue = parseInt(hash, 16) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 40) % 360}, 70%, 40%))`;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showAvatar && (
        <div 
          className={`${sizeClasses[avatarSize]} rounded-full flex items-center justify-center font-bold`}
          style={{ 
            background: getAvatarGradient(walletAddress),
            color: '#fff',
          }}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p 
          className={`font-medium text-sm truncate ${isLoading ? 'animate-pulse' : ''}`}
          style={{ color: isCustomAlias ? '#fbbf24' : '#fff' }}
          title={showFullAddress ? walletAddress : displayName || walletAddress}
        >
          {displayName || 'Loading...'}
        </p>
        {/* Show wallet address as secondary text if alias is displayed */}
        {isCustomAlias && showFullAddress && (
          <p className="text-gray-500 text-xs truncate">
            {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Simplified inline display for use in text
 */
export function InlineUserDisplay({ 
  walletAddress,
  className = '',
}: { 
  walletAddress: string; 
  className?: string;
}) {
  const { displayName, isCustomAlias } = useUserAlias(walletAddress);

  return (
    <span 
      className={`font-medium ${className}`}
      style={{ color: isCustomAlias ? '#fbbf24' : 'inherit' }}
      title={walletAddress}
    >
      {displayName}
    </span>
  );
}
