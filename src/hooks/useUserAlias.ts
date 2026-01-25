'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseUserAliasResult {
  displayName: string | null;
  alias: string | null;
  isLoading: boolean;
  isCustomAlias: boolean;
  refetch: () => void;
}

// In-memory alias cache for the current session
const aliasCache = new Map<string, { alias: string | null; fetchedAt: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Helper function to truncate wallet address
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Hook to fetch and display user aliases
 * Priority: Custom alias → Truncated address
 */
export function useUserAlias(walletAddress: string | undefined): UseUserAliasResult {
  const [alias, setAlias] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey(k => k + 1);
    // Clear cache for this address
    if (walletAddress) {
      aliasCache.delete(walletAddress.toLowerCase());
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      setAlias(null);
      return;
    }

    const addressLower = walletAddress.toLowerCase();

    // Check cache
    const cached = aliasCache.get(addressLower);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setAlias(cached.alias);
      return;
    }

    let cancelled = false;

    async function fetchAlias() {
      setIsLoading(true);
      
      try {
        // Fetch custom alias from API
        const response = await fetch(`/api/user/alias?wallet=${addressLower}`);
        if (!cancelled && response.ok) {
          const data = await response.json();
          setAlias(data.alias || null);
          
          // Cache the result
          aliasCache.set(addressLower, {
            alias: data.alias || null,
            fetchedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to fetch alias:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchAlias();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, fetchKey]);

  // Determine display name
  let displayName: string | null = null;
  if (alias) {
    displayName = alias;
  } else if (walletAddress) {
    displayName = truncateAddress(walletAddress);
  }

  return {
    displayName,
    alias,
    isLoading,
    isCustomAlias: !!alias,
    refetch,
  };
}

/**
 * Batch fetch aliases for multiple wallets
 * Useful for feed-like views with many users
 */
export async function fetchAliasesBatch(wallets: string[]): Promise<Record<string, string>> {
  if (!wallets.length) return {};
  
  try {
    const response = await fetch(`/api/user/alias?wallets=${wallets.join(',')}`);
    if (response.ok) {
      const data = await response.json();
      return data.aliases || {};
    }
  } catch (error) {
    console.error('Failed to batch fetch aliases:', error);
  }
  
  return {};
}

/**
 * Save a user's alias
 */
export async function saveAlias(walletAddress: string, alias: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/user/alias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress, alias }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to save alias' };
    }

    // Clear cache for this address
    aliasCache.delete(walletAddress.toLowerCase());

    return { success: true };
  } catch (error) {
    console.error('Failed to save alias:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Check if an alias is available
 */
export async function checkAliasAvailability(
  alias: string, 
  currentWallet?: string
): Promise<{ available: boolean; reason?: string }> {
  try {
    const params = new URLSearchParams({ alias });
    if (currentWallet) {
      params.set('wallet', currentWallet);
    }
    
    const response = await fetch(`/api/user/alias/check?${params}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to check alias availability:', error);
  }
  
  return { available: false, reason: 'Error checking availability' };
}
